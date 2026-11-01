const endpoint = process.env.AWS_LAMBDA_HTTP_ENDPOINT || "0.0.0.0:3000";
const [host, port] = endpoint.split(":");

process.env.HOSTNAME = host;
process.env.PORT = port;

// Hand off to the compiled Next.js standalone server
require("./server.js");