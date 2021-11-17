const router = require('express').Router();
const fs = require('fs')
const path = require('path')
const logger = require('../logger')
const config = require('../config')
const { capture, exclude, error } = require('../services/urls')
const { applicationStatus } = require('../services/globals')

var testOnlyRegEx = RegExp('test\-only');
var stubRegEx = RegExp('http:\/\/localhost:[0-9]{4}\/([a-z/-]+\-stub)');
var allowListRegex = RegExp('http:\/\/localhost:[0-9]{4}\/(secure-message-stub)');
var htmlContentRegEx = RegExp('<\\s*html[^>]*>([\\s\\S]*?)<\\s*\/\\s*html>');

router.post('/', (req, res, next) => {
  const body = req.body;
  const logData = Object.assign({}, body)
  const pageDirectory = path.join(config.pagesDirectory, '' + body.timestamp)
  logData.pageHTML = logData.pageHTML.substr(0, 100) + '...'
  logData.files = Object.keys(logData.files)
  const ALLOWED_STATUS = ["READY", "PAGES_CAPTURED"]
  const allowedStatusNotIncluded = (status) => { return !ALLOWED_STATUS.includes(status) }

  if(allowedStatusNotIncluded(global.status)) {
    logger.log('WARN', `Cannot capture page when status is ${global.status}. URL:${body.pageURL} will not be captured.`)
    return res.status(400).send({error:`Cannot capture page when status is ${global.status}.`})
  }

  //Capture the page for assessment if:
  //   - it hasn't already been captured and onePagePerPath is true
  //   - the page url matches allowListRegex or does not contain the text 'stub'
  //   - the page is not test-only
  //   - the page contains valid HTML tags
  if((config.captureAllPages === 'true' || !global.capturedUrls.includes(body.pageURL))
      && (allowListRegex.test(body.pageURL) || !stubRegEx.test(body.pageURL))
      && !testOnlyRegEx.test(body.pageURL)
      && htmlContentRegEx.test(body.pageHTML)){

    for (var assetError in logData.errors) {
      error(logData.errors[assetError].failedUrl, body.pageURL)
    };

    capture(body.pageURL)
    const fileList = Object.assign({}, body.files, {'index.html': body.pageHTML}, {'data': body.pageURL})
    fs.mkdirSync(pageDirectory, { recursive: true })

    Object.keys(fileList).forEach(fileName => {
      let fileExtension = path.extname(fileName);
      if(fileExtension !== ".js") {
        fs.writeFile(path.join(pageDirectory, fileName), fileList[fileName], (err, data) => {
          if (err) {throw err}
          logger.log('INFO', `Captured ${fileName} for ${body.pageURL}`)
        })
      }
    })
    applicationStatus('PAGES_CAPTURED')
  } else {
    if(!global.capturedUrls.includes(body.pageURL) && !global.excludedUrls.includes(body.pageURL) ) {
      exclude(body.pageURL)
    }
  }
  res.status('201').send()
})

module.exports = router;
