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
  // Served from a stand-in origin so the panel can fetch its icon list like it does in Home Assistant.
  await page.route('http://vtb.test/**', route => route.request().url().includes('/visual_template_builder/mdi-icons.json')
    ? route.fulfill({contentType:'application/json', body:fs.readFileSync('custom_components/visual_template_builder/frontend/mdi-icons.json','utf8')})
    : route.fulfill({contentType:'text/html', body:'<html><body style="margin:0"><visual-template-builder-panel></visual-template-builder-panel></body></html>'}));
  await page.goto('http://vtb.test/');
  await page.addScriptTag({content:fs.readFileSync('custom_components/visual_template_builder/frontend/panel.js','utf8')});
  await page.evaluate(() => {
    window.calls=[]; window.defs=[]; window.rev=0;
    const panel=document.querySelector('visual-template-builder-panel');
    panel.hass={language:'it',states:{'sensor.power':{state:'1200',attributes:{friendly_name:'Potenza casa',unit_of_measurement:'W'}}},callWS:async message=>{
      calls.push(message);
      if(message.action==='metadata')return {number:['power','energy'],binary:['running','problem']};
      if(message.action==='list')return {sensors:defs,revision:rev};
      if(message.action==='preview') {
        const evaluate = node => {
          if(node.op==='value') return node.value;
          if(node.op==='entity') { const state=panel.hass.states[node.entity_id]; if(!state || ['unknown','unavailable'].includes(state.state)) throw Error('Source unavailable'); return state.state; }
          if(node.op==='if') return evaluate(node.args[0]) ? evaluate(node.args[1]) : evaluate(node.args[2]);
          const values=node.args.map(evaluate);
          if(node.op==='eq') return values[0]===values[1];
          if(node.op==='divide') return Number(values[0])/Number(values[1]);
          if(node.op==='add') return values.reduce((a,b)=>Number(a)+Number(b),0);
          if(node.op==='gt') return Number(values[0])>Number(values[1]);
          if(node.op==='and') return values.every(Boolean);
          if(node.op==='or') return values.some(Boolean);
          if(node.op==='not') return !values[0];
          if(node.op==='concat') return values.join('');
          if(node.op==='round') return Number(Number(values[0]).toFixed(Number(values[1])));
          return null;
        };
        try{return {value:evaluate(message.definition.expression),error:null,sources:message.definition.kind==='text'?['cover.cover_71_2']:['sensor.power']};}
        catch(error){return {value:null,error:error.message,sources:[]};}
      }
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
  await page.getByLabel('Entità',{exact:true}).fill('sensor.power');
  await page.getByLabel('Valore',{exact:true}).fill('1000');
  await page.getByText('Opzioni avanzate',{exact:true}).click();
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
  assert.equal(await page.getByRole('radio',{name:'Numero',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Annulla',exact:true}).click();
  await page.getByRole('button',{name:'Duplica',exact:true}).click();
  assert.equal(await page.getByRole('radio',{name:'Numero',exact:true}).isDisabled(),false);
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Annulla',exact:true}).click();
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button',{name:'Modifica',exact:true}).click();
  if (screenshotDir) await page.screenshot({path:`${screenshotDir}/panel-desktop.png`,fullPage:true});
  await page.getByRole('button',{name:'Annulla',exact:true}).click();
  await page.getByRole('button',{name:'Elimina',exact:true}).click();
  await page.getByText('Il tuo primo sensore visuale',{exact:true}).waitFor();
  // State-to-text is the default for new text sensors: no nested operations.
  await page.evaluate(() => {
    const panel=document.querySelector('visual-template-builder-panel');
    panel.hass={...panel.hass, states:{...panel.hass.states,'cover.cover_71_2':{state:'closed',attributes:{friendly_name:'Cover 71'}}}};
  });
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Crea sensore',exact:true}).click();
  await page.getByLabel('Nome',{exact:true}).fill('Stato tapparella');
  await page.locator('.kind-card').filter({hasText:'Testo'}).click();
  assert.equal(await page.getByLabel('Operazione',{exact:true}).count(),0);
  await page.getByLabel('Quale entità vuoi descrivere?',{exact:true}).fill('cover.cover_71_2');
  await page.getByLabel('Quale entità vuoi descrivere?',{exact:true}).press('Tab');
  assert.equal(await page.locator('.mapping-row').count(),4);
  await page.getByLabel('Mostra questo testo 1',{exact:true}).fill('Tapparella chiusa');
  await page.waitForFunction(()=>document.querySelector('visual-template-builder-panel').shadowRoot.querySelector('.result')?.textContent==='Tapparella chiusa');
  // Live source changes update preview without losing unsaved text.
  await page.evaluate(() => {
    const panel=document.querySelector('visual-template-builder-panel');
    panel.hass={...panel.hass,states:{...panel.hass.states,'cover.cover_71_2':{state:'opening',attributes:{friendly_name:'Cover 71'}}}};
  });
  await page.waitForFunction(()=>document.querySelector('visual-template-builder-panel').shadowRoot.querySelector('.result')?.textContent==='In apertura');
  assert.equal(await page.getByLabel('Mostra questo testo 1',{exact:true}).inputValue(),'Tapparella chiusa');
  assert.equal(await page.locator('.mapping-row.active').count(),1);
  assert.equal(await page.evaluate(()=>document.querySelector('visual-template-builder-panel').shadowRoot.querySelector('main').scrollWidth<=390),true);
  if(screenshotDir) {
    await page.evaluate(()=>document.querySelector('visual-template-builder-panel').scrollTo(0,0));
    await page.screenshot({path:`${screenshotDir}/mapping-mobile.png`,fullPage:true});
    await page.setViewportSize({width:1440,height:1100});
    await page.screenshot({path:`${screenshotDir}/mapping-desktop.png`,fullPage:true});
  }
  // Switching views preserves the expression exactly, with no migration metadata.
  const before = await page.evaluate(()=>structuredClone(document.querySelector('visual-template-builder-panel').draft.expression));
  await page.getByRole('button',{name:'Regole e calcoli',exact:true}).click();
  await page.getByRole('button',{name:'Stato → testo',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>document.querySelector('visual-template-builder-panel').draft.expression),before);
  await page.getByLabel('Quando lo stato è 2',{exact:true}).selectOption('closed');
  await page.getByRole('button',{name:'Salva sensore',exact:true}).click();
  await page.getByRole('status').getByText('Ogni stato può comparire una sola volta.',{exact:false}).waitFor();
  await page.getByLabel('Quando lo stato è 2',{exact:true}).selectOption('open');
  await page.getByRole('button',{name:'Salva sensore',exact:true}).click();
  await page.getByRole('button',{name:'Modifica',exact:true}).click();
  assert.equal(await page.locator('.mapping-row').count(),4);
  assert.equal(await page.getByLabel('Mostra questo testo 1',{exact:true}).inputValue(),'Tapparella chiusa');
  await page.getByRole('button',{name:'Annulla',exact:true}).click();
  // Existing 0.1.0 rules (including the user's closed/otherwise example) reopen simply.
  await page.evaluate(()=> {
    const panel=document.querySelector('visual-template-builder-panel');
    const original={op:'if',args:[{op:'eq',args:[{op:'entity',entity_id:'cover.cover_71_2',attribute:''},{op:'value',value:'closed'}]},{op:'value',value:'chiuso'},{op:'value',value:'aperto'}]};
    panel.start({...defs[0],expression:original});
    window.originalExpression=original;
  });
  assert.equal(await page.locator('.mapping-row').count(),1);
  assert.equal(await page.getByLabel('Per gli altri stati',{exact:true}).inputValue(),'aperto');
  await page.getByRole('button',{name:'Salva sensore',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>calls.filter(c=>c.action==='save').at(-1).definition.expression),await page.evaluate(()=>originalExpression));
  // Complex existing text rules must stay in advanced mode, unchanged.
  await page.evaluate(()=> {
    const panel=document.querySelector('visual-template-builder-panel');
    panel.start({...defs[0],expression:{op:'concat',args:[{op:'value',value:'Potenza: '},{op:'entity',entity_id:'sensor.power'}]}});
  });
  assert.equal(await page.getByRole('button',{name:'Stato → testo',exact:true}).isDisabled(),true);
  assert.equal(await page.getByLabel('Cosa vuoi ottenere?',{exact:true}).inputValue(),'concat');
  // General editor: compact conditional rule, summary and editable literal values.
  await page.evaluate(()=> {
    const panel=document.querySelector('visual-template-builder-panel');
    panel.start({...defs[0], expression:structuredClone(originalExpression)});
  });
  await page.getByRole('button',{name:'Regole e calcoli',exact:true}).click();
  assert.equal(await page.locator('.node').count(),0,'Old nested node boxes must not be rendered');
  assert.equal(await page.locator('.comparison-line').count(),1);
  assert.equal(await page.getByLabel('Confronto',{exact:true}).inputValue(),'eq');
  await page.getByLabel('Valore',{exact:true}).nth(1).fill('Tapparella chiusa');
  await page.getByLabel('Valore',{exact:true}).nth(2).fill('Tapparella aperta');
  await page.getByText('La regola in parole',{exact:true}).waitFor();
  assert.match(await page.locator('.rule-summary-text').textContent(),/Tapparella chiusa/);
  // Capture a complete general editor, not the state mapping shortcut.
  await page.setViewportSize({width:1440,height:1100});
  await page.waitForFunction(()=>document.querySelector('visual-template-builder-panel').shadowRoot.querySelector('.result')?.textContent==='Tapparella aperta');
  if(screenshotDir) {
    await page.evaluate(()=>document.querySelector('visual-template-builder-panel').scrollTo(0,0));
    await page.screenshot({path:`${screenshotDir}/general-desktop.png`,fullPage:true});
  }
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.querySelector('visual-template-builder-panel').shadowRoot.querySelector('main').scrollWidth<=390),true);
  if(screenshotDir) await page.screenshot({path:`${screenshotDir}/general-mobile.png`,fullPage:true});
  await page.getByRole('button',{name:'Salva sensore',exact:true}).click();
  assert.equal(await page.evaluate(()=>defs[0].expression.args[1].value),'Tapparella chiusa');
  // Build a numeric comparison through the new controls, then combine it with another.
  await page.evaluate(()=> {
    const panel=document.querySelector('visual-template-builder-panel');
    panel.start();
    panel.hass={...panel.hass,states:{...panel.hass.states,'switch.enabled':{state:'on',attributes:{friendly_name:'Macchina abilitata'}}}};
  });
  await page.getByLabel('Nome',{exact:true}).fill('In produzione');
  await page.locator('.kind-card').filter({hasText:'Acceso / spento'}).click();
  await page.getByLabel('Entità',{exact:true}).fill('sensor.power');
  await page.getByLabel('Entità',{exact:true}).press('Tab');
  await page.getByLabel('Confronto',{exact:true}).selectOption('gt');
  await page.getByLabel('Usa',{exact:true}).nth(1).selectOption('number');
  await page.getByLabel('Valore',{exact:true}).fill('100');
  const comparison = await page.evaluate(()=>structuredClone(document.querySelector('visual-template-builder-panel').draft.expression));
  await page.getByLabel('Cosa vuoi ottenere?',{exact:true}).selectOption('group');
  assert.deepEqual(await page.evaluate(()=>document.querySelector('visual-template-builder-panel').draft.expression.args[0]),comparison);
  await page.getByRole('button',{name:'+ Aggiungi condizione',exact:true}).click();
  // Chosen entities become chips, so only the new condition still shows a search box.
  assert.equal(await page.getByLabel('Entità',{exact:true}).count(),1);
  await page.getByLabel('Entità',{exact:true}).fill('switch.enabled');
  await page.getByLabel('Entità',{exact:true}).press('Tab');
  await page.waitForFunction(()=>document.querySelector('visual-template-builder-panel').shadowRoot.querySelector('.result')?.textContent==='ON');
  assert.match(await page.locator('.rule-summary-text').textContent(),/Potenza casa.*100.*e.*Macchina abilitata/);
  if(screenshotDir) {
    await page.setViewportSize({width:1440,height:1100});
    await page.evaluate(()=>document.querySelector('visual-template-builder-panel').scrollTo(0,0));
    await page.screenshot({path:`${screenshotDir}/conditions-desktop.png`,fullPage:true});
  }
  await page.getByRole('button',{name:'Salva sensore',exact:true}).click();
  assert.equal(await page.evaluate(()=>defs[0].expression.op),'and');
  assert.equal(await page.evaluate(()=>defs[0].expression.args.length),2);
  // Attribute controls retain existing values; reopening must not rewrite expressions.
  await page.evaluate(()=> {
    const panel=document.querySelector('visual-template-builder-panel');
    panel.start({...defs[0],kind:'number',expression:{op:'round',args:[{op:'entity',entity_id:'sensor.power',attribute:'watts'},{op:'value',value:2}]}});
    window.attributeExpression=structuredClone(panel.draft.expression);
  });
  assert.equal(await page.getByLabel('Valore da leggere',{exact:true}).inputValue(),'watts');
  await page.getByLabel('Operazione',{exact:true}).selectOption('divide');
  assert.equal(await page.getByLabel('Valore da leggere',{exact:true}).inputValue(),'watts');
  assert.equal(await page.getByLabel('Valore',{exact:true}).inputValue(),'2');
  await page.getByLabel('Operazione',{exact:true}).selectOption('round');
  assert.deepEqual(await page.evaluate(()=>document.querySelector('visual-template-builder-panel').draft.expression),await page.evaluate(()=>attributeExpression));
  // Entity picker: search by friendly name, keyboard choice, readable chip and property copy.
  await page.evaluate(()=>{const panel=document.querySelector('visual-template-builder-panel');panel.dirty=false;panel.start();});
  const picker=page.getByLabel('Entità',{exact:true});
  await picker.click();
  await picker.pressSequentially('potenza');
  assert.equal(await page.locator('.entity-option').count(),1);
  assert.match(await page.locator('.entity-option').textContent(),/Potenza casa.*sensor\.power.*1200 W/);
  await picker.press('Enter');
  assert.equal(await page.evaluate(()=>document.querySelector('visual-template-builder-panel').draft.expression.args[0].entity_id),'sensor.power');
  assert.match(await page.locator('.entity-chip').textContent(),/Potenza casa.*1200 W/);
  await page.getByRole('button',{name:'Cambia · Entità',exact:true}).click();
  await page.getByLabel('Entità',{exact:true}).fill('pot');
  await page.getByLabel('Nome',{exact:true}).click();
  assert.equal(await page.evaluate(()=>document.querySelector('visual-template-builder-panel').draft.expression.args[0].entity_id),'sensor.power','Partial searches must not replace the chosen entity');
  await page.getByText('Opzioni avanzate',{exact:true}).click();
  await page.getByRole('button',{name:'Copia da Potenza casa',exact:true}).click();
  assert.equal(await page.getByLabel('Unità di misura',{exact:true}).inputValue(),'W');
  // Quick examples replace the starting rule with an ordinary expression.
  await page.evaluate(()=>{const panel=document.querySelector('visual-template-builder-panel');panel.dirty=false;panel.start();});
  await page.getByRole('button',{name:'Converti unità (W → kW)',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>document.querySelector('visual-template-builder-panel').draft.expression),{op:'divide',args:[{op:'entity',entity_id:'',attribute:''},{op:'value',value:1000}]});
  assert.equal(await page.getByLabel('Operazione',{exact:true}).inputValue(),'divide');
  assert.equal(await page.evaluate(()=>document.querySelector('visual-template-builder-panel').shadowRoot.querySelector('main').scrollWidth<=390),true);
  // Nested calculations are framed blocks with their own type and operation, no hidden menus.
  await page.evaluate(()=>{const panel=document.querySelector('visual-template-builder-panel');panel.dirty=false;panel.start({name:'Annidato',kind:'number',missing:'unavailable',unit:'',device_class:'',state_class:'',icon:'',expression:{op:'subtract',args:[{op:'add',args:[{op:'entity',entity_id:'sensor.power',attribute:''},{op:'value',value:5}]},{op:'value',value:1}]}});});
  assert.equal(await page.locator('.expression.nested').count(),1);
  assert.equal(await page.locator('.change-rule').count(),0);
  assert.equal(await page.locator('.expression.nested').getByLabel('Operazione',{exact:true}).inputValue(),'add');
  assert.equal(await page.locator('.expression.nested').getByLabel('Usa',{exact:true}).first().inputValue(),'math');
  await page.locator('.expression.nested').getByRole('button',{name:'+ Aggiungi valore',exact:true}).click();
  assert.equal(await page.evaluate(()=>document.querySelector('visual-template-builder-panel').draft.expression.args[0].args.length),3);
  // Icon picker: suggestions on focus, search by name or alias, keyboard choice and the backend's mdi: format.
  await page.getByText('Opzioni avanzate',{exact:true}).click();
  const iconInput=page.getByLabel('Icona',{exact:true});
  await iconInput.click();
  assert.equal(await page.locator('.icon-option .icon-name').first().textContent(),'mdi:flash');
  await iconInput.fill('solar pan');
  await page.locator('.icon-option',{hasText:'mdi:solar-panel'}).first().waitFor();
  assert.equal(await page.locator('.icon-option .icon-name').first().textContent(),'mdi:solar-panel');
  await iconInput.fill('lightning');
  await page.locator('.icon-option',{hasText:'mdi:flash'}).first().waitFor();
  // A search left unfinished never becomes the icon.
  await page.getByLabel('Unità di misura',{exact:true}).click();
  assert.equal(await iconInput.inputValue(),'');
  assert.equal(await page.evaluate(()=>document.querySelector('visual-template-builder-panel').draft.icon),'');
  await iconInput.fill('solar-power');
  await page.locator('.icon-name',{hasText:/^mdi:solar-power$/}).waitFor();
  await iconInput.press('Enter');
  assert.equal(await iconInput.inputValue(),'mdi:solar-power');
  assert.equal(await page.locator('.icon-options').isHidden(),true);
  assert.equal(await page.evaluate(()=>document.querySelector('visual-template-builder-panel').draft.icon),'mdi:solar-power');
  // Versioning: the header shows the loaded release; a newer server version asks for a reload.
  await page.evaluate(()=>{const panel=document.querySelector('visual-template-builder-panel');panel.dirty=false;panel.cancel();panel.panel={config:{version:'0.3.0-aaaaaaaaaa'}};});
  assert.equal(await page.locator('.version-label').textContent(),'v0.3.0');
  assert.equal(await page.locator('.update-notice').count(),0);
  await page.evaluate(()=>{document.querySelector('visual-template-builder-panel').panel={config:{version:'0.3.0-bbbbbbbbbb'}};});
  await page.getByRole('button',{name:'Ricarica',exact:true}).waitFor();
  assert.equal(await page.locator('.version-label').getAttribute('title'),'0.3.0-aaaaaaaaaa');
  assert.deepEqual(errors,[]);
  console.log('Panel checks passed: general expressions, conditions, summaries, attributes, state mappings, mobile layout and legacy preservation.');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
