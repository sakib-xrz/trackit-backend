const app = require("./app");
const config = require("./config");
const prisma = require("./config/prisma");

let server;

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log("✅ Connected to MySQL Database via Prisma");

    server = app.listen(config.port, () => {
      console.log(
        `🚀 Track It Server running on port ${config.port} [${config.env}]`,
      );
      console.log(
        `📂 API Documentation: http://localhost:${config.port}/api/docs`,
      );
    });
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1);
  }

  const exitHandler = () => {
    if (server) {
      server.close(async () => {
        await prisma.$disconnect();
        console.log("Server closed.");
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  };

  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    exitHandler();
  });

  process.on("unhandledRejection", (error) => {
    console.error("Unhandled Rejection:", error);
    exitHandler();
  });
}

bootstrap();
