import * as playwright from 'playwright'
import path from 'path'
import url from 'url'
import os from 'os'
import {promises as fs} from 'fs'

  const pathToExtension = path.join(import.meta.dirname, 'extension')
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'tmp'))
  const browserContext = await playwright.chromium.launchPersistentContext(tmp, {channel:'chrome',
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ]
  })
  let [serviceWorkerPage] = browserContext.serviceWorkers();
  if (!serviceWorkerPage)
    serviceWorkerPage = await browserContext.waitForEvent('serviceworker');
  const page = await browserContext.newPage()
  await page.goto(url.pathToFileURL(path.join(import.meta.dirname, 'test.html')).href)

  await serviceWorkerPage.evaluate(async () => {
    let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => { chrome.dom.openOrClosedShadowRoot(document.querySelector('span')).querySelector('input').value = "bebo" }
    });
  })

await new Promise(r => setTimeout(r, 1000 * 60))
await browserContext.close()
await fs.rm(tmp, {recursive:true})
