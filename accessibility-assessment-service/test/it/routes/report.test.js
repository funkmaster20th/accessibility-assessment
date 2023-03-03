const express = require("express");
const {reset} = require("./../../../app/services/globals");
const request = require("supertest");

describe('report', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json({limit: '500mb',}));
        app.use(require("./../../../app/router"))
        reset()
    });

    afterEach(() => {
        reset()
    });

    it("should respond 'HTML report is not available' for /html when status is not REPORT_READY", async () => {
        await request(app)
            .get('/api/report/html')
            .then((response) => {
                expect(response.status).toEqual(200)
                expect(response.text).toEqual('<html><body>The html report is not available.</body></html>')
                expect(global.status).not.toEqual('REPORT_READY')
            })

    });

    it("should return empty JSON for /json response when status is not REPORT_READY", async () => {
        await request(app)
            .get('/api/report/json')
            .then((response) => {
                expect(response.status).toEqual(200)
                expect(response.body).toEqual({})
                expect(global.status).not.toEqual('REPORT_READY')
            })
    });

    it("should return HTTP status 404 for /csv report when status is not REPORT_READY", async () => {
        await request(app)
            .get('/api/report/csv')
            .then((response) => {
                expect(response.status).toEqual(404)
                expect(global.status).not.toEqual('REPORT_READY')
            })
    });

    it("should return 'report is not available' for /bundle report when status is not REPORT_READY", async () => {
        await request(app)
            .get('/api/report/bundle')
            .then((response) => {
                expect(response.status).toEqual(400)
                expect(response.text).toContain("The report is not available.")
                expect(global.status).not.toEqual('REPORT_READY')
            })
    });

    it("should return 404 when the requested page is not available", async () => {
        await request(app)
            .get('/api/report/pages/1638446620761/index.html')
            .then((response) => {
                expect(response.status).toEqual(404)
            })
    });

    it("should return 200 when the requested page is available", async () => {
        //setup to capture a HTML page.
        const res = await request(app)
            .post('/api/capture-page')
            .set('Content-Type', 'application/json')
            .send({
                pageURL: "https://local.tax.service.gov.uk/simple/page/capture",
                pageHTML: "<html><head><title>Some title</title></head><main>The contents of the page</main></html>",
                timestamp: "0000000002",
                files: {"file1": "some contents"}
            })
        expect(res.statusCode).toEqual(201)

        await request(app)
            .get('/api/report/pages/0000000002/index.html')
            .then((response) => {
                expect(response.status).toEqual(200)
                expect(response.headers['content-type']).toEqual('text/html; charset=UTF-8')
                expect(response.text).toContain('Some title')
            })
    });
});