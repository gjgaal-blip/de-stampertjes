const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./tests/browser',timeout:30000,fullyParallel:true,workers:2,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://127.0.0.1:8765',trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'python3 -m http.server 8765 --bind 127.0.0.1',url:'http://127.0.0.1:8765',reuseExistingServer:!process.env.CI},
  projects:[
    {name:'desktop-chromium',use:{...devices['Desktop Chrome'],viewport:{width:1280,height:900}}},
    {name:'mobile-chromium',use:{...devices['Pixel 7']}},
    {name:'mobile-webkit',use:{...devices['iPhone 13']}},
    {name:'desktop-firefox',use:{...devices['Desktop Firefox']}}
  ]
});
