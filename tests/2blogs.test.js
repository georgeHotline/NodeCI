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

describe ('When not logged in', async() => {
    const actions = [
        {   method: 'get',
            path: '/api/blogs'
        },
         {   method: 'post',
            path: '/api/blogs',
            data: { title: "My Title", content: 'My Content'}
        }
    ];

    test('...blog-related actions are prohibited', async() => {
        const results = await page.execRequests(actions);

        for (let result of results) {
            expect(result).toEqual({error: 'You must log in!'});
        }
    })

    // test('...user cannot create blog posts', async() => {
    //     const result = await page.post(
    //         '/api/blogs',{ title: 'My Title', content: 'My Content'});
    //     expect(result).toEqual({ error: 'You must log in!' });
    // });

    // test('...user cannot get list of posts', async() => {
    //     const result = await page.get('/api/blogs');
    //     expect(result).toEqual({ error: 'You must log in!' });
    // });
});

describe('When logged in', async() => {
    beforeEach(async() => {
        await page.login();
        await page.click('a.btn-floating.btn-large.red');
    });

    test('...click the new blog button, you get the blog create form', async() => {
        // open home page and login with google - should be on /blogs route
        await page.login();
    
        // click "add" button - should be on blogs/new route with blog create form
        await page.click('a.btn-floating.btn-large.red');
    
        const label = await page.getContentsOf('form label');
        expect(label).toEqual('Blog Title');
    });

    describe('With VALID inputs to create blog form', async() => {
        beforeEach(async() => {
            await page.type('.title input', 'JSET new title');
            await page.type('.content input', 'JSET new content');
            await page.click('form button');
        });

        test('...submit takes user to review screen', async() => {
            const text = await page.getContentsOf('h5');
            expect(text).toEqual('Please confirm your entries');        });

        test('...submit and save adds blog to index screen', async() => {
            await page.click('button.green');
            await page.waitFor('.card');

            const title = await page.getContentsOf('.card-title');
            const content = await page.getContentsOf('p');

            expect(title).toEqual('JSET new title');
            expect(content).toEqual('JSET new content');
        });

    });

    describe('With INVALID inputs to create blog form', async() => {
        beforeEach(async() => {
            await page.click('form button');
        });

        test('...produces error message', async() => {
            const titleError = await page.getContentsOf('.title .red-text');
            const contentError = await page.getContentsOf('.content .red-text');
            
            expect(titleError).toEqual('You must provide a value');
            expect(contentError).toEqual('You must provide a value');
        });
    });
    
});