{ pkgs, lib, config, inputs, ... }:

{
  languages = {
    javascript = {
      enable = true;
      package = pkgs.nodejs_25;
      npm.enable = true;
      pnpm = {
        enable = true;
        install.enable = true;
      };
    };
  };
}
