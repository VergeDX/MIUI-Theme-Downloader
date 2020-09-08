// Import yargs lib, import using Destructuring assignment.
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
const {argv} = require('yargs')

// Args needed a url param.
// If not, exit with code -1.
if (argv._.length !== 1) {
    console.log("Usage: miui-theme-downloader [theme_url]. ")
    process.exit(-1)
}

// miui theme link url, example:
// http://zhuti.xiaomi.com/detail/fffc9612-2682-4e61-b390-0504ff154644
let input_url = argv._[0]
let theme_token = input_url.split('/')[4]

const API_BASE = 'https://thm.market.xiaomi.com/thm/download/v2/'

// https://nodejs.org/api/querystring.html
const querystring = require('querystring');
const fetch = require('node-fetch')

let fetch_url = `${API_BASE}${theme_token}?` + querystring.encode({miuiVersion: 'V12'})
fetch(fetch_url).then(r => r.json().then(json => {
    // apiCode != 0,
    if (json.apiCode !== 0) {
        console.log(`Fetch error, message: ${json.apiData}`)
        process.exit(-2)
    }

    // https://github.com/Automattic/cli-table
    const Table = require('cli-table');
    const table = new Table();

    const apiData = json.apiData
    const file_name = decodeURIComponent(apiData.downloadUrl.split('/')[6])
    table.push(
        {'File hash': apiData.fileHash},
        {'File size': (apiData.fileSize / 1e6).toFixed(2) + ' MB'});

    console.log(table.toString());
    console.log(`Downloading theme file ${file_name}...`)

    download_file(apiData.downloadUrl, file_name)
}))

/**
 * Download file from given url & file name.
 * If file exist, it will overwrite it.
 * @see https://stackoverflow.com/questions/11944932/
 */
function download_file(download_url, file_name) {
    const https = require('https');
    const fs = require('fs');

    const file = fs.createWriteStream(file_name);
    https.get(download_url, response => response.pipe(file));
}
