declare module "node-cron" {
  function schedule(cronExpression: string, callback: () => void): void
  export = schedule
}
