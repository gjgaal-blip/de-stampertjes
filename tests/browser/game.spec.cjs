const {test,expect}=require('@playwright/test');
// Every non-local request is intercepted BEFORE navigation. Never write to production.
test.beforeEach(async({page})=>{
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='127.0.0.1')return route.continue();
    const result=url.pathname.includes('highscores')?[{name:'TESTHELD',score:1500,level:3}]:url.pathname.includes('community_posts')?[]:{};
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
  });
  await page.addInitScript(()=>{localStorage.setItem('stampertjesSeenVersion','2.26');localStorage.setItem('stampertjesNameAsked','1');localStorage.setItem('stampertjesMusic','0');});
});
test('menu and all sections open without JavaScript errors',async({page},info)=>{
  test.setTimeout(90000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.locator('#playMenuBtn')).toBeVisible();
  await page.screenshot({path:info.outputPath('menu.png'),fullPage:true});
  for(const [button,section] of [['scoresMenuBtn','scoresSection'],['statsMenuBtn','statsSection'],['historyMenuBtn','historySection'],['newsMenuBtn','roadmapSection'],['helpMenuBtn','helpSection'],['cafeMenuBtn','cafeSection'],['hallMenuBtn','hallSection'],['merchMenuBtn','merchSection'],['roomsMenuBtn','roomsSection']]){
    await page.locator('#'+button).click();await expect(page.locator('#'+section)).toBeVisible();
    await page.locator('#'+section+' [data-back]').click();await expect(page.locator('#mainMenu')).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test('all ten practice rooms render and remain separate from records',async({page},info)=>{
  test.setTimeout(90000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.locator('#roomsMenuBtn').click();
  await expect(page.locator('[data-practice-level]')).toHaveCount(10);
  await page.screenshot({path:info.outputPath('atlas.png'),fullPage:true});
  const stats=await page.evaluate(()=>localStorage.getItem('stampertjesStats'));
  for(let n=1;n<=10;n++){
    if(n>1)await page.locator('#roomsMenuBtn').click();
    await page.locator(`[data-practice-level="${n}"]`).click();
    await expect(page.locator('#overlay')).toBeHidden();await expect(page.locator('#practiceBadge')).toBeVisible();
    await page.screenshot({path:info.outputPath(`room-${n}.png`)});
    await page.locator('#pauseToggle').click();await expect(page.locator('#pauseOverlay')).toBeVisible();
    await page.locator('#devPortalBtn').click();await expect(page.locator('#mainMenu')).toBeVisible();
    await page.waitForTimeout(260);
  }
  expect(await page.evaluate(()=>localStorage.getItem('stampertjesStats'))).toBe(stats);expect(errors).toEqual([]);
});
test('keyboard pause and Escape preserve the game',async({page})=>{
  await page.goto('/');await page.locator('#playMenuBtn').click();await page.keyboard.press('p');
  await expect(page.locator('#pauseOverlay')).toBeVisible();await page.waitForTimeout(200);await page.keyboard.press('Escape');
  await expect(page.locator('#pauseOverlay')).toBeHidden();await expect(page.locator('#overlay')).toBeHidden();
  await page.waitForTimeout(200);await page.keyboard.press('Escape');await expect(page.locator('#pauseOverlay')).toBeVisible();
  await page.locator('#pauseStopBtn').click();await page.locator('#pauseCancelStopBtn').click();await expect(page.locator('#pauseResumeBtn')).toBeVisible();
  await page.locator('#pauseStopBtn').click();await page.locator('#pauseConfirmStopBtn').click();await expect(page.locator('#mainMenu')).toBeVisible();
});
test('narrow and landscape controls fit the screen',async({page},info)=>{
  for(const viewport of [{width:320,height:700},{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(viewport);await page.goto('/');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.locator('#playMenuBtn').click();
    for(const id of ['stamp','pauseToggle']){if(id==='stamp'&&!await page.locator('#stamp').isVisible())continue;const box=await page.locator('#'+id).boundingBox();expect(box).not.toBeNull();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(viewport.width+1);expect(box.y+box.height).toBeLessThanOrEqual(viewport.height+1);}
    await page.screenshot({path:info.outputPath(`game-${viewport.width}.png`)});
  }
});
test('offline scores show fallback and menu stays playable',async({page})=>{
  await page.route('**/rest/**',route=>route.abort());await page.goto('/');await page.locator('#scoresMenuBtn').click();await expect(page.locator('#scoreList')).toContainText('lokaal',{ignoreCase:true});
  await page.locator('#scoresSection [data-back]').click();await page.locator('#playMenuBtn').click();await expect(page.locator('#overlay')).toBeHidden();
});
test('admin rejects an invalid code and survives network failure',async({page})=>{
  await page.route('**/rpc/verify_stampertjes_admin',r=>r.fulfill({status:200,contentType:'application/json',body:'false'}));
  await page.goto('/admin.html');await page.locator('#adminCode').fill('test-invalid');await page.locator('#loginBtn').click();await expect(page.locator('#loginStatus')).toContainText('Onjuiste');await expect(page.locator('#portal')).toBeHidden();
  await page.route('**/rpc/verify_stampertjes_admin',r=>r.abort());await page.locator('#loginBtn').click();await expect(page.locator('#loginStatus')).toContainText('mislukt');await expect(page.locator('#loginBtn')).toBeEnabled();
});
