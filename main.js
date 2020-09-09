#! /usr/bin/env node

// Import yargs lib, import using Destructuring assignment.
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
const {program} = require('commander')

// https://github.com/tj/commander.js/blob/HEAD/Readme_zh-CN.md#%E9%80%89%E9%A1%B9
program.requiredOption('-u --url <string>', '[required] miui theme market share url. ')
program.option('-m --miuiVersion <string>', '[optional] specific miui version in v[10 - 12]. ', 'v12')
program.parse(process.argv)

// miui theme token, example: miui theme link is:
// http://zhuti.xiaomi.com/detail/fffc9612-2682-4e61-b390-0504ff154644
// token is: fffc9612-2682-4e61-b390-0504ff154644
const theme_token = program.url.split('/')[4]
const API_BASE = 'https://thm.market.xiaomi.com/thm/download/v2/'

// https://nodejs.org/api/querystring.html
const querystring = require('querystring')
const fetch = require('node-fetch')

// default miui version is v12.
const miui_version = program.miuiVersion
const fetch_url = `${API_BASE}${theme_token}?` + querystring.encode({miuiVersion: miui_version})
fetch(fetch_url).then(r => r.json().then(json => {
    // apiCode != 0,
    if (json.apiCode !== 0) {
        console.log(`Fetch error, message: ${json.apiData}`)
        process.exit(-2)
    }

    // https://github.com/Automattic/cli-table
    const Table = require('cli-table')
    const table = new Table()

    const apiData = json.apiData
    const file_name = decodeURIComponent(apiData.downloadUrl.split('/')[6])

    table.push(
        {'File hash': apiData.fileHash},
        {'File size': (apiData.fileSize / 1e6).toFixed(2) + ' MB'})

    console.log(table.toString())
    const real_file_name = download_file(apiData.downloadUrl, file_name)
    console.log(`Downloading theme file ${real_file_name}...`)
}))

/**
 * Download file from given url & file name.
 * If file exist, it will overwrite it.
 * @see https://stackoverflow.com/questions/11944932/
 */
function download_file(download_url, file_name) {
    const https = require('https')
    const fs = require('fs')

    const path = require('path')
    const file_ext_name = path.extname(file_name)
    const file_base_name = path.basename(file_name, file_ext_name)

    const real_file_name = `${file_base_name}_${miui_version}${file_ext_name}`
    const file = fs.createWriteStream(real_file_name)
    https.get(download_url, response => response.pipe(file))

    return real_file_name
}
