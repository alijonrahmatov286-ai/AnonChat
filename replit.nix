{ pkgs }: {
  deps = [
    pkgs.nodejs
  ];
  env = {
    REPLIT_ENTRYPOINT = "server.js";
  };
}