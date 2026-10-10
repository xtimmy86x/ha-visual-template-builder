/* Browser-level editor checks; HA websocket responses are mocked here. */
const {chromium} = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const screenshotDir = process.env.VTB_SCREENSHOT_DIR;
if (screenshotDir) fs.mkdirSync(screenshotDir, {recursive:true});
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.VTB_CHROMIUM_PATH, args:process.env.VTB_CHROMIUM_PATH ? ["--no-sandbox", "--disable-dev-shm-usage", "--no-zygote", "--single-process"] : []});
  const page = await browser.newPage({viewport:{width:390,height:844}});
  const errors=[]; page.on('pageerror', error=>errors.push(error.message));
  await page.setContent('<html><body style="margin:0"><visual-template-builder-panel></visual-template-builder-panel></body></html>');
  await page.addScriptTag({content:fs.readFileSync('custom_components/visual_template_builder/frontend/panel.js','utf8')});
  await page.evaluate(() => {
    window.calls=[]; window.defs=[]; window.rev=0;
    const panel=document.querySelector('visual-template-builder-panel');
    panel.hass={language:'it',states:{'sensor.power':{state:'1200',attributes:{friendly_name:'Potenza casa',unit_of_measurement:'W'}}},callWS:async message=>{
      calls.push(message);
      if(message.action==='metadata')return {number:['power','energy'],binary:['running','problem']};
      if(message.action==='list')return {sensors:defs,revision:rev};
      if(message.action==='preview')return {value:1.2,error:null,sources:['sensor.power']};
      if(message.action==='save'){
        const d=structuredClone(message.definition);d.id=d.id||'a'.repeat(32);d.entity_id='sensor.visual_power';
        defs=[d];return {sensors:defs,revision:++rev};
      }
      if(message.action==='delete'){defs=[];return {sensors:defs,revision:++rev};}
    }};
  });
  await page.getByRole('button',{name:'Crea sensore',exact:true}).click();
  await page.getByLabel('Nome',{exact:true}).fill('Consumo netto');
  // Compose division: entity / numeric constant.
  await page.getByLabel('Operazione',{exact:true}).first().selectOption('divide');
  await page.getByLabel('Operazione',{exact:true}).nth(1).selectOption('entity');
  await page.getByLabel('Entità',{exact:true}).fill('sensor.power');
  await page.getByLabel('Valore fisso',{exact:true}).fill('1000');
  await page.getByText('Proprietà e disponibilità',{exact:true}).click();
  await page.getByLabel('Unità di misura',{exact:true}).fill('kW');
  await page.getByLabel('Classe dispositivo',{exact:true}).selectOption('power');
  await page.getByLabel('Se il calcolo non è disponibile',{exact:true}).selectOption('keep');
  await page.waitForFunction(()=>document.querySelector('visual-template-builder-panel').shadowRoot.querySelector('.result')?.textContent==='1.2');
  assert.equal(await page.evaluate(()=>{let r=document.querySelector('visual-template-builder-panel').shadowRoot.querySelector('main');return r.scrollWidth<=390;}),true,'Mobile editor must not overflow horizontally');
  if (screenshotDir) await page.screenshot({path:`${screenshotDir}/panel-mobile.png`,fullPage:true});
  await page.getByRole('button',{name:'Salva sensore',exact:true}).click();
  const saved=await page.evaluate(()=>calls.find(c=>c.action==='save').definition);
  assert.equal(saved.expression.op,'divide');assert.equal(saved.expression.args[0].entity_id,'sensor.power');assert.equal(saved.expression.args[1].value,1000);assert.equal(saved.missing,'keep');
  await page.getByRole('button',{name:'Modifica',exact:true}).click();
  assert.equal(await page.getByLabel('Risultato',{exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Annulla',exact:true}).click();
  await page.getByRole('button',{name:'Duplica',exact:true}).click();
  assert.equal(await page.getByLabel('Risultato',{exact:true}).isDisabled(),false);
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Annulla',exact:true}).click();
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button',{name:'Modifica',exact:true}).click();
  if (screenshotDir) await page.screenshot({path:`${screenshotDir}/panel-desktop.png`,fullPage:true});
  await page.getByRole('button',{name:'Annulla',exact:true}).click();
  await page.getByRole('button',{name:'Elimina',exact:true}).click();
  await page.getByText('Il tuo primo sensore visuale',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('Panel checks passed: mobile layout, compose, preview, save, edit, duplicate, delete.');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
