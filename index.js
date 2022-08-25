const { readdirSync, readFileSync } = require('fs');
var esprima = require('esprima');

function getExtension(path) {
    var basename = path.split(/[\\/]/).pop(),  // extract file name from full path ...
        // (supports `\\` and `/` separators)
        pos = basename.lastIndexOf(".");       // get last position of `.`

    if (basename === "" || pos < 1)            // if file name is empty or ...
        return "";                             //  `.` not found (-1) or comes first (0)

    return basename.slice(pos + 1);            // extract extension ignoring `.`
}

const getFileList = (dirName) => {
    let files = [];
    const items = readdirSync(dirName, { withFileTypes: true });

    for (const item of items) {
        if (item.isDirectory()) {
            files = [...files, ...getFileList(`${dirName}/${item.name}`)];
        } else {
            if (getExtension(item.name) === 'js' || getExtension(item.name) === 'ts') {
                var script = readFileSync(`${dirName}/${item.name}`, 'utf-8')
                var data = esprima.parseScript(script, { tokens: true });
                data['path'] = `${dirName}/${item.name}`
                files.push(data);
            }
        }
    }

    return files;
};

const CheckImportation = (path) => {


    const scripts = getFileList(path)
    var unusedVariables = [];

    scripts.forEach(script => {

        var declearedVariablesInScript = []
        script.body.forEach(statment => {
            if (statment.type === 'VariableDeclaration') {
                declearedVariablesInScript.push(statment.declarations[0].id);
            }
        })
        var unusedVariablesInScript = declearedVariablesInScript;

        script.body.forEach(statment => {
            if (statment.type !== 'VariableDeclaration') {
                statment.expression.arguments.forEach((arg) => {
                    unusedVariablesInScript.splice(
                        declearedVariablesInScript.reduce((id) => {
                            return JSON.stringify(id) === JSON.stringify(arg)
                        }) - 1, 1
                    )
                })
            }
        })

        unusedVariables[script.path] = unusedVariablesInScript
    });



    return unusedVariables
}



module.exports = CheckImportation