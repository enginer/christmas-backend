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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const env_1 = require("@kvs/env");
const app = (0, express_1.default)();
const port = process.env.PORT || 3003;
app.use(express_1.default.json());
app.use((0, cors_1.default)({ origin: ["http://localhost:3000", "https://????"] }));
app.post('/vote', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.query) {
        res.status(400).end();
        return;
    }
    const { userId: userIdRaw, projectId: projectIdRaw } = req.query;
    const userId = userIdRaw;
    const projectId = projectIdRaw;
    if (!userId || !projectId) {
        res.status(400).end();
        return;
    }
    const db = yield (0, env_1.kvsEnvStorage)({
        name: "votes",
        version: 1
    });
    const projectIdsRaw = yield db.get(userId);
    if (projectIdsRaw) {
        const projectIds = projectIdsRaw.split(",");
        if (projectIds.includes(projectId)) {
            res.status(200).end("Vote for this project already registered");
            return;
        }
        if (projectIds.length >= 3) {
            // too much votes forgiven user
            res.status(400).end("Too much votes for user");
            return;
        }
        yield db.set(userId, projectIdsRaw + "," + projectId);
    }
    else {
        yield db.set(userId, projectId);
    }
    res.status(200).end("Vote registered");
}));
app.get('/votes', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var e_1, _a;
    const db = yield (0, env_1.kvsEnvStorage)({
        name: "votes",
        version: 1
    });
    const projectVotesMap = {};
    try {
        for (var db_1 = __asyncValues(db), db_1_1; db_1_1 = yield db_1.next(), !db_1_1.done;) {
            const [_, value] = db_1_1.value;
            value.split(",").forEach(project => {
                if (projectVotesMap[project] === undefined) {
                    projectVotesMap[project] = 1;
                }
                else {
                    projectVotesMap[project]++;
                }
            });
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (db_1_1 && !db_1_1.done && (_a = db_1.return)) yield _a.call(db_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    const data = Object.keys(projectVotesMap).map(project => {
        return {
            project,
            votes: projectVotesMap[project]
        };
    });
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
}));
app.listen(port, function () {
    console.log(`App is listening on port http://localhost:${port} !`);
});
