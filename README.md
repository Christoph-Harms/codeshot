# codeshot

## Requirements
This script requires Node.js

## Usage
Run the script using `node PATH/TO/CODESHOT` or install it globally

## Parameters
All parameters are optional.

| Name       | Type    | Description                                                                                                           |
| ---------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| input      | string  | Set the folder to read files from to be highlighted and snapshotted                                                   |
| output     | string  | Set the folder to store generated snapshots to                                                                        |
| scale      | number  | Factor to scale the snapshot image size                                                                               |
| stylesheet | string  | Path to an additional `.css` file to adjust layout of generated snapshots                                             |
| theme      | string  | The template to be used for highlighting code. See [Prism.js documentation](http://prismjs.com/) for available themes |
| debug      | boolean | Write `.html` files of generated snapshots to output folder.                                                          |

Full example:
```
codeshot --input=/PATH/TO/PROJECT --output=/PATH/TO/SNAPSHOTS --scale=3 --stylesheet=/PATH/TO/CUSTOM.css --theme=dark --debug
```

## Installation
To install codeshot globally run `npm install -g` in codeshot directory.
After installation you can run the script from everywhere with `codeshot`