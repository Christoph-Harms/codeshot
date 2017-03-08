#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const webshot = require("webshot");
const Encoder = require("htmlencode");
const Prism = require("prismjs");
const Readline = require("readline");
const argv = require('yargs').argv;
const file = require('file');

// const styles = [
//     '/vendor/prism.css',
//     '/styles.css'
// ];
const libs = [
    '/node_modules/prismjs/prism.js',
    '/node_modules/prismjs/plugins/line-numbers/prism-line-numbers.js'
];

const LANG_MAP = {
    "js"    : "javascript",
    "htm"   : "markup",
    "html"  : "markup",
    "scss"  : "sass",
    "ts"    : "typescript"
};

let langs = [ "markup" ];
let template;

function wrap( content, lang )
{
    if ( !template )
    {
        let html = fs.readFileSync( __dirname + "/template.html", 'utf-8');
        template = html.split("[#CONTENT#]");

        let styles = [];
        let theme = "prism";
        if (argv.theme && ["coy", "dark", "funky", "okaidia", "solarizedlight", "tomorrow", "twilight"].includes(argv.theme) )
        {
            theme += "-" + argv.theme;
        }
        styles.push( __dirname + "/node_modules/prismjs/themes/"+ theme + ".css" );
        styles.push( __dirname + "/node_modules/prismjs/plugins/line-numbers/prism-line-numbers.css" );

        if (argv.stylesheet && fs.existsSync(argv.stylesheet))
        {
            styles.push( argv.stylesheet );
        }

        let styleContent = styles.map( (cssFile) => {
            return fs.readFileSync( cssFile, 'utf-8' );
        }).join(" ");
        let scale = argv.scale || 1;
        styleContent += "#capture { " +
            "display: inline-block; " +
            "overflow: hidden; " +
            "transform-origin: top left; " +
            "-webkit-transform-origin: top left; " +
            "-moz-transform-origin: top left; " +
            "-ms-transform-origin: top left; " +
            "-o-transform-origin: top left; " +
            "transform: scale(" + scale + "); " +
            "-webkit-transform: scale(" + scale + "); " +
            "-moz-transform: scale(" + scale + "); " +
            "-ms-transform: scale(" + scale + "); " +
            "-o-transform: scale(" + scale + ");" +
            "}";
        template[0] = template[0].replace("[#CSS#]", styleContent );

        let components = [
            '/node_modules/prismjs/prism.js',
            // '/node_modules/prismjs/components/prism-core.js',
            ...langs.map( (lang) => "/node_modules/prismjs/components/prism-" + lang + ".js"),
            '/node_modules/prismjs/plugins/line-numbers/prism-line-numbers.js'
        ];
        let jsContent = components.map( (jsFile) => {
            return fs.readFileSync( __dirname + jsFile, 'utf-8' );
        }).join(" ");

        let tmp = template[1].split("[#JS#]");
        template[1] = tmp[0] + jsContent + tmp[1];
    }

    return template[0] + '<code class="language-' + lang + '">' + Encoder.htmlEncode(content) + "</code>" + template[1];
}

function createSnapshots( files, outdir )
{
    let file = files.shift();
    if ( file )
    {
        return createSnapshot( file, outdir ).then( () => {
            createSnapshots( files, outdir );
        });
    }
    else
    {
        return Promise.resolve();
    }
}
function createSnapshot( file, outdir )
{
    let ext = path.extname( file.filename ).substr(1);
    let lang = LANG_MAP[ext] || ext;
    let outFile = path.join( file.dirname, file.filename.replace(".", "-") + ".jpeg" );

    return new Promise( (resolve, reject) => {
        fs.readFile( file.path, 'utf-8', (err, content) => {
            if ( err )
            {
                reject(err);
            }

            let lines = content.split("\n").length;
            let columns = Math.max( ...content.split("\n").map( (line) => line.length) );

            if ( argv.debug ) {
                fs.writeFile( path.join( outdir, file.dirname, file.filename.replace(".", "-") + ".html") , wrap(content, lang) );
            }

            webshot(
                wrap(content, lang),
                path.join( outdir, outFile ),
                {
                    siteType: 'html',
                    phantomPath: require("phantomjs2").path,
                    defaultWhiteBackground: true,
                    quality: 100,
                    windowSize: {
                        width: columns * 30,
                        height: lines * 60
                    },
                    captureSelector: "#capture",
                    errorIfJSException: true
                },
                (err) => {
                    if ( err )
                    {
                        reject(err);
                    }
                    console.log( "Snapshot created: " + outFile );
                    resolve();
                }
            )
        });
    });
}

function getInputFolder() {
    let read;
    if ( argv.input && argv.input.length > 0 )
    {
        read = Promise.resolve( argv.input );
    }
    else
    {
        read = new Promise( (resolve, reject) => {
            const read = Readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            read.question("Folder to read files from:", (answer) => {
                resolve( answer );
                read.close();
            });
        });
    }

    return read.then( (input) => {
        if ( !fs.existsSync( input ) )
        {
            return Promise.reject("Folder " + input + " does not exist");
        }
        return input;
    });
}

function getOutputFolder() {
    let read;
    if ( argv.output && argv.output.length > 0 )
    {
        read = Promise.resolve( argv.output );
    }
    else
    {
        read = new Promise( (resolve, reject) => {
            const read = Readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            read.question("Folder to store screenshots in:", (answer) => {
                resolve( answer );
                read.close();
            });
        });
    }

    return read.then( (output) => {
        if ( !fs.existsSync( output ) )
        {
            return Promise.reject("Folder " + output + " does not exist");
        }
        return output;
    });
}

function getInputFiles()
{
    return getInputFolder().then( (input) => {
        let fileList = [];
        file.walkSync( input, (path, dirs, files) => {
            let fileEntries = files.map( (file) => {
                return {
                    filename: file,
                    dirname: path.substr( input.length ),
                    path: path + "/" + file
                }
            });
            fileList = fileList.concat( fileEntries );
        });
        return fileList;
    });
}


getInputFiles().then( (files) => {
    getOutputFolder().then( (out) => {
        files.forEach( (file) => {
            let ext = path.extname( file.filename ).substr(1);
            let lang = LANG_MAP[ext] || ext;
            if ( !langs.includes(lang) )
            {
                langs.push( LANG_MAP[ext] || ext );
            }
        });
        // files.forEach( (file) => {
        //     createSnapshot( file, out );
        // });
        createSnapshots( files, out );
    });
});

