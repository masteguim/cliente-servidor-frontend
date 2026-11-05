
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 8080;

const tipos = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
};

const servidor = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const nome = url.pathname === "/" ? "/index.html" : url.pathname;
    const arquivo = path.resolve(__dirname, "." + nome);

    if (!arquivo.startsWith(__dirname + path.sep)) {
        res.writeHead(403);
        res.end("Acesso negado");
        return;
    }

    fs.readFile(arquivo, (erro, conteudo) => {
        if (erro) {
            res.writeHead(erro.code === "ENOENT" ? 404 : 500);
            res.end("Arquivo não disponível");
            return;
        }

        const tipo = tipos[path.extname(arquivo)] || "application/octet-stream";

        res.writeHead(200, { "Content-Type": tipo });
        res.end(conteudo);
    });
});

servidor.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});
