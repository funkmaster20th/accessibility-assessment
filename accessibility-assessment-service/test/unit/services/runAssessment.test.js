const {artefactLocation} = require('./../../../app/services/runAssessment')
const {initialiseApp, reset} = require("./../../../app/services/globals");

beforeEach(() => {
    reset()
});

afterAll(() => {
    reset()
});

describe('artefactLocation', () => {
    it("should return '/api/report/pages' when 'buildUrl()' is BUILD_URL_NOT_PROVIDED", () => {
        expect(artefactLocation()).toEqual('http://localhost:6010/api/report/pages');
    });

    it("should return the Jenkins artefactLocation when initialised with buildUrl", () => {
        initialiseApp('example-accessibility-tests', 'https://build.org.uk/');
        expect(artefactLocation()).toEqual('https://build.org.uk/artifact/pages');
    });
});