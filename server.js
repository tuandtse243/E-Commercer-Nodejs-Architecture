const app = require('./src/app')

const server = app.listen( process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`)       
})

process.on('SIGTIN', () => {
    server.close(() => console.log(`Exit Server Express`))
})