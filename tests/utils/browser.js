const fs = require('fs');
let browserLogStream;

const feedBackDocs = async (testName = 'allLogs', existingDocIds = []) => {
  const feedBackDocs = await browser.executeAsync(feedBackDocsScript);
  const flattened = feedBackDocs.flat();
  const newDocIds = flattened.map(doc => existingDocIds.indexOf(doc.id) === -1);
  if (newDocIds && newDocIds.length > 0) {
    fs.writeFileSync(`./tests/logs/feedbackDocs-${testName}.json`, JSON.stringify(flattened, null, 2));
    return flattened.map(doc => doc.id);
  }
};


const feedBackDocsScript = async (done) => {
  //This is running inside the browser. indexedDB and PouchDB is available there.
  // eslint-disable-next-line no-undef
  const allDbList = await indexedDB.databases();
  const metaDbList = allDbList.filter(db => db.name.includes('pouch_medic-user') && db.name.endsWith('-meta'));
  done(Promise.all(metaDbList.map(async (db) => {
    const nameStripped = db.name.replace('_pouch_', '');
    // eslint-disable-next-line no-undef
    const metaDb = new PouchDB(nameStripped);
    const docs = await metaDb.allDocs({ include_docs: true, startkey: 'feedback-', endkey: 'feedback-\ufff0' });
    return docs.rows;
  })));
};

const getCookies = (...cookieNameList) => { 
  return browser.getCookies(cookieNameList);
};

const saveBrowserLogs = () => {
  // wdio also writes in this file
  if (!browserLogStream) {
    browserLogStream = fs.createWriteStream(__dirname + '/../logs/browser.console.log');
  }

  return browser
    .manage()
    .logs()
    .get('browser')
    .then(logs => {
      const currentSpec = jasmine.currentSpec.fullName;
      browserLogStream.write(`\n~~~~~~~~~~~ ${currentSpec} ~~~~~~~~~~~~~~~~~~~~~\n\n`);
      logs
        .map(log => `[${log.level.name_}] ${log.message}\n`)
        .forEach(log => browserLogStream.write(log));
      browserLogStream.write('\n~~~~~~~~~~~~~~~~~~~~~\n\n');
    });
};

module.exports = {
  feedBackDocs,
  getCookies,
  saveBrowserLogs
};
