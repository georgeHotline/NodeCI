const Page = require('./helpers/page');

let page;

// --------------------------------------------------------
// steps to follow before invoking each test
beforeEach( async () => {
    page = await Page.build();
    await page.goto('http://localhost:3000');
});

// --------------------------------------------------------
// steps to follow after running each test
afterEach( async () => {
    await page.close();
});

// --------------------------------------------------------
test('header has correct text', async () => {
    const text = await page.getContentsOf('a.brand-logo');
    expect(text).toEqual('Blogster');
});

// --------------------------------------------------------
test('clicking login initiates OAuth flow', async () => {
    // click the 'login with Google' link in the header
    await page.click('a[href="/auth/google"]');

    // check the url of the page that gets launched
    const url = await page.url();

    // url should include a specific string sequence
    expect(url).toMatch(/accounts\.google\.com/);
});

// --------------------------------------------------------
test('when signed in, logout button is visible', async () => {

    await page.login();

    const text = await page.getContentsOf('a[href="/auth/logout"]');

    expect(text).toEqual('Logout');

});
