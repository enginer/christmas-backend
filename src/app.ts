import cors from 'cors'
import express, {Application, Request, Response} from 'express'
import {kvsEnvStorage} from "@kvs/env";

const app: Application = express()

const port = process.env.PORT || 3003

app.use(express.json())
app.use(cors({ origin: ["http://localhost:3000", "https://????"] }))

app.post('/vote', async (req: Request, res: Response) => {
    if (!req.query) {
        res.status(400).end()
        return
    }
    const { userId: userIdRaw, projectId: projectIdRaw } = req.query

    const userId = userIdRaw as string
    const projectId = projectIdRaw as string

    if (!userId || !projectId) {
        res.status(400).end()
        return
    }

    const db = await kvsEnvStorage({
        name: "votes",
        version: 1
    })

    const projectIdsRaw = await db.get(userId) as string
    if (projectIdsRaw) {
        const projectIds = projectIdsRaw.split(",")

        if (projectIds.includes(projectId)) {
            res.status(200).end("Vote for this project already registered")
            return
        }

        if (projectIds.length >= 3) {
            // too much votes forgiven user
            res.status(400).end("Too much votes for user")
            return
        }

        await db.set(userId, projectIdsRaw + "," + projectId)
    } else {
        await db.set(userId, projectId)
    }

    res.status(200).end("Vote registered")
})

app.get('/votes', async (req: Request, res: Response) => {
    const db = await kvsEnvStorage({
        name: "votes",
        version: 1
    })

    const projectVotesMap: {[key: string]: number} = {}

    for await (const [_, value] of db) {
        (value as string).split(",").forEach( project => {
            if (projectVotesMap[project] === undefined) {
                projectVotesMap[project] = 1
            } else {
                projectVotesMap[project]++
            }
        })
    }

    const data = Object.keys(projectVotesMap).map( project => {
        return {
            project,
            votes: projectVotesMap[project]
        }
    })

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))

})

app.listen(port, function () {
    console.log(`App is listening on port http://localhost:${port} !`)
})