const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {
    static async build() {
        // create a browswer instance
        const browser = await puppeteer.launch({
            headless: true, 
            args: ['--no-sandbox']
        });

        // generate new puppeteer page within the browser
        const page = await browser.newPage();

        // create new instance of CustomPage
        const customPage = new CustomPage(page, browser);

        // combine both into a Proxy object
        return new Proxy(customPage, {
            get: function(target, property) {
                // 1 - use overrides defined in customPage 
                return customPage[property] || 

                // 2 - use methods tied to the puppeteer browswer
                // to control access to the browswer directly from 
                // the proxy.
                browser[property] ||
                
                // 3 - use methods tied to the puppeteer page class
                page[property];
            }
        });
    }

    constructor(page) {
        // whenever we create a new instance of CustomPage
        // save the link to the page reference that was 
        // passed in as this.page
        this.page = page;
    }

    async login() {
        // create new DB user fro the user factory
        const user = await userFactory();

        // create session parameters for the newly created user from
        // the session factory
        const {session, sig} = sessionFactory(user);
    
        await this.page.setCookie({ name: 'session', value: session });
        await this.page.setCookie({ name: 'session.sig', value: sig });
        await this.page.goto('http://localhost:3000/blogs');
        await this.page.waitFor('a[href="/auth/logout"]');
    }

    async getContentsOf(selector) {
        return this.page.$eval(selector, el => el.innerHTML);
    }

    get(path) {
        //pass the path variable into evaluate as an arguent
        //to make sure the path is properly parsed
        return this.page.evaluate((_path) => {
            return fetch(_path, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res => res.json());
        }, path);
    } 

    post(path, data) {
        return this.page.evaluate((_path, _data) => {

            return fetch(_path, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify (_data)
            }).then(res => res.json());
        }, path, data)
    }

    execRequests(actions) {
        return Promise.all(
            actions.map( ({method, path, data}) => {
                return this[method](path, data);
            })
        )
    }
}

module.exports = CustomPage;