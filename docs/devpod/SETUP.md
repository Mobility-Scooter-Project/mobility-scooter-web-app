# Setup
## Dependencies
Make sure you have the following dependencies installed on your system:
- Docker
- [Devpod CLI](https://devpod.sh/docs/getting-started/install#install-devpod-cli)

## gitignored files
The following files are gitignored and need to be downloaded separately:
- `apps/api/.env`
- `kubeconfig.yaml` (in the root directory)

The kubeconfig.yaml is *required* in order to connect to the devpod.

## Prepare your devpod environment
1. Run the appropriate setup script for your operating system:
   - For macOS/Linux:
     ```bash
     ./scripts/devpod/setup.sh
     ```
   - For Windows (PowerShell):
     ```powershell
     .\scripts\devpod\setup.ps1
     ```
   
    __Note for Windows users__: If you encounter an error related to script execution policies, you may need to change the policy temporarily. You can do this by running PowerShell as an administrator and executing:
    ```powershell
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
    ```
    __Note for WSL users__: Devpod cannot be launched from WSL. Please clone the repository in your Windows filesystem (e.g., `C:\path\to\repo`) and run the setup.ps1 script from there.
    
    __Note for Unix users__: If you encounter a "Permission denied" error when running the setup.sh script, you may need to make the script executable. You can do this by running:
    ```bash
    chmod +x ./scripts/devpod/setup.sh
    ```
2. Start your devpod:
   ```bash
   devpod up .
   ```
   This usually works on the second try, as the first attempt may fail due to errors copying over large files. If it fails, simply run the command again. If you encounter issues, consult the [troubleshooting guide](../05_TROUBLESHOOTING.md).