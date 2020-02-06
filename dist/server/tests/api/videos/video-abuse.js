"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
require("mocha");
const videos_1 = require("../../../../shared/models/videos");
const index_1 = require("../../../../shared/extra-utils/index");
const follows_1 = require("../../../../shared/extra-utils/server/follows");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const blocklist_1 = require("../../../../shared/extra-utils/users/blocklist");
const expect = chai.expect;
describe('Test video abuses', function () {
    let servers = [];
    let abuseServer2;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(50000);
            servers = yield index_1.flushAndRunMultipleServers(2);
            yield index_1.setAccessTokensToServers(servers);
            yield follows_1.doubleFollow(servers[0], servers[1]);
            const video1Attributes = {
                name: 'my super name for server 1',
                description: 'my super description for server 1'
            };
            yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, video1Attributes);
            const video2Attributes = {
                name: 'my super name for server 2',
                description: 'my super description for server 2'
            };
            yield index_1.uploadVideo(servers[1].url, servers[1].accessToken, video2Attributes);
            yield jobs_1.waitJobs(servers);
            const res = yield index_1.getVideosList(servers[0].url);
            const videos = res.body.data;
            expect(videos.length).to.equal(2);
            servers[0].video = videos.find(video => video.name === 'my super name for server 1');
            servers[1].video = videos.find(video => video.name === 'my super name for server 2');
        });
    });
    it('Should not have video abuses', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield index_1.getVideoAbusesList(servers[0].url, servers[0].accessToken);
            expect(res.body.total).to.equal(0);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.equal(0);
        });
    });
    it('Should report abuse on a local video', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(15000);
            const reason = 'my super bad reason';
            yield index_1.reportVideoAbuse(servers[0].url, servers[0].accessToken, servers[0].video.id, reason);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have 1 video abuses on server 1 and 0 on server 2', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res1 = yield index_1.getVideoAbusesList(servers[0].url, servers[0].accessToken);
            expect(res1.body.total).to.equal(1);
            expect(res1.body.data).to.be.an('array');
            expect(res1.body.data.length).to.equal(1);
            const abuse = res1.body.data[0];
            expect(abuse.reason).to.equal('my super bad reason');
            expect(abuse.reporterAccount.name).to.equal('root');
            expect(abuse.reporterAccount.host).to.equal('localhost:' + servers[0].port);
            expect(abuse.video.id).to.equal(servers[0].video.id);
            const res2 = yield index_1.getVideoAbusesList(servers[1].url, servers[1].accessToken);
            expect(res2.body.total).to.equal(0);
            expect(res2.body.data).to.be.an('array');
            expect(res2.body.data.length).to.equal(0);
        });
    });
    it('Should report abuse on a remote video', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            const reason = 'my super bad reason 2';
            yield index_1.reportVideoAbuse(servers[0].url, servers[0].accessToken, servers[1].video.id, reason);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have 2 video abuses on server 1 and 1 on server 2', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res1 = yield index_1.getVideoAbusesList(servers[0].url, servers[0].accessToken);
            expect(res1.body.total).to.equal(2);
            expect(res1.body.data).to.be.an('array');
            expect(res1.body.data.length).to.equal(2);
            const abuse1 = res1.body.data[0];
            expect(abuse1.reason).to.equal('my super bad reason');
            expect(abuse1.reporterAccount.name).to.equal('root');
            expect(abuse1.reporterAccount.host).to.equal('localhost:' + servers[0].port);
            expect(abuse1.video.id).to.equal(servers[0].video.id);
            expect(abuse1.state.id).to.equal(videos_1.VideoAbuseState.PENDING);
            expect(abuse1.state.label).to.equal('Pending');
            expect(abuse1.moderationComment).to.be.null;
            const abuse2 = res1.body.data[1];
            expect(abuse2.reason).to.equal('my super bad reason 2');
            expect(abuse2.reporterAccount.name).to.equal('root');
            expect(abuse2.reporterAccount.host).to.equal('localhost:' + servers[0].port);
            expect(abuse2.video.id).to.equal(servers[1].video.id);
            expect(abuse2.state.id).to.equal(videos_1.VideoAbuseState.PENDING);
            expect(abuse2.state.label).to.equal('Pending');
            expect(abuse2.moderationComment).to.be.null;
            const res2 = yield index_1.getVideoAbusesList(servers[1].url, servers[1].accessToken);
            expect(res2.body.total).to.equal(1);
            expect(res2.body.data).to.be.an('array');
            expect(res2.body.data.length).to.equal(1);
            abuseServer2 = res2.body.data[0];
            expect(abuseServer2.reason).to.equal('my super bad reason 2');
            expect(abuseServer2.reporterAccount.name).to.equal('root');
            expect(abuseServer2.reporterAccount.host).to.equal('localhost:' + servers[0].port);
            expect(abuseServer2.state.id).to.equal(videos_1.VideoAbuseState.PENDING);
            expect(abuseServer2.state.label).to.equal('Pending');
            expect(abuseServer2.moderationComment).to.be.null;
        });
    });
    it('Should update the state of a video abuse', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const body = { state: videos_1.VideoAbuseState.REJECTED };
            yield index_1.updateVideoAbuse(servers[1].url, servers[1].accessToken, abuseServer2.video.uuid, abuseServer2.id, body);
            const res = yield index_1.getVideoAbusesList(servers[1].url, servers[1].accessToken);
            expect(res.body.data[0].state.id).to.equal(videos_1.VideoAbuseState.REJECTED);
        });
    });
    it('Should add a moderation comment', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const body = { state: videos_1.VideoAbuseState.ACCEPTED, moderationComment: 'It is valid' };
            yield index_1.updateVideoAbuse(servers[1].url, servers[1].accessToken, abuseServer2.video.uuid, abuseServer2.id, body);
            const res = yield index_1.getVideoAbusesList(servers[1].url, servers[1].accessToken);
            expect(res.body.data[0].state.id).to.equal(videos_1.VideoAbuseState.ACCEPTED);
            expect(res.body.data[0].moderationComment).to.equal('It is valid');
        });
    });
    it('Should hide video abuses from blocked accounts', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            {
                yield index_1.reportVideoAbuse(servers[1].url, servers[1].accessToken, servers[0].video.uuid, 'will mute this');
                yield jobs_1.waitJobs(servers);
                const res = yield index_1.getVideoAbusesList(servers[0].url, servers[0].accessToken);
                expect(res.body.total).to.equal(3);
            }
            const accountToBlock = 'root@localhost:' + servers[1].port;
            {
                yield blocklist_1.addAccountToServerBlocklist(servers[0].url, servers[0].accessToken, accountToBlock);
                const res = yield index_1.getVideoAbusesList(servers[0].url, servers[0].accessToken);
                expect(res.body.total).to.equal(2);
                const abuse = res.body.data.find(a => a.reason === 'will mute this');
                expect(abuse).to.be.undefined;
            }
            {
                yield blocklist_1.removeAccountFromServerBlocklist(servers[0].url, servers[0].accessToken, accountToBlock);
                const res = yield index_1.getVideoAbusesList(servers[0].url, servers[0].accessToken);
                expect(res.body.total).to.equal(3);
            }
        });
    });
    it('Should hide video abuses from blocked servers', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const serverToBlock = servers[1].host;
            {
                yield blocklist_1.addServerToServerBlocklist(servers[0].url, servers[0].accessToken, servers[1].host);
                const res = yield index_1.getVideoAbusesList(servers[0].url, servers[0].accessToken);
                expect(res.body.total).to.equal(2);
                const abuse = res.body.data.find(a => a.reason === 'will mute this');
                expect(abuse).to.be.undefined;
            }
            {
                yield blocklist_1.removeServerFromServerBlocklist(servers[0].url, servers[0].accessToken, serverToBlock);
                const res = yield index_1.getVideoAbusesList(servers[0].url, servers[0].accessToken);
                expect(res.body.total).to.equal(3);
            }
        });
    });
    it('Should delete the video abuse', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            yield index_1.deleteVideoAbuse(servers[1].url, servers[1].accessToken, abuseServer2.video.uuid, abuseServer2.id);
            yield jobs_1.waitJobs(servers);
            {
                const res = yield index_1.getVideoAbusesList(servers[1].url, servers[1].accessToken);
                expect(res.body.total).to.equal(1);
                expect(res.body.data.length).to.equal(1);
                expect(res.body.data[0].id).to.not.equal(abuseServer2.id);
            }
            {
                const res = yield index_1.getVideoAbusesList(servers[0].url, servers[0].accessToken);
                expect(res.body.total).to.equal(3);
            }
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield index_1.cleanupTests(servers);
        });
    });
});