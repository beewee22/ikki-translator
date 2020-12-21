module.exports = {
  apps: [
    {
      name: "ikki-translator",
      script: "./main.ts",
      interpreter: "deno",
      interpreterArgs: "run --allow-net --allow-read",
    },
  ],
};