# Holidays Website - Frontend

## Documentation

-   [Sitecore JSS](https://jss.sitecore.com)
-   [Next.js](https://nextjs.org/docs)

## Run the app

### Install node

It's recommended to use [nvm-windows](https://github.com/coreybutler/nvm-windows).

Install node: `nvm install $(Get-Content .nvmrc)`

Use node: `nvm use $(Get-Content .nvmrc)`

### Initial set up

1. Run `npm install`
2. Run `npm install` in `C:/projects/digital/Prototypes`
3. Configure Sitecore CA certificate for Node.js in `C:/certificates/SIFRoot.cer`. [Read the guide](https://doc.sitecore.com/xp/en/developers/hd/190/sitecore-headless-development/walkthrough--configuring-sitecore-ca-certificates-for-node-js.html).
4. Add entry below to your hosts file (`C:\Windows\System32\drivers\etc\hosts` for Windows or `/etc/hosts` for MacOS):
    ```
    127.0.0.1  local.webdev.ejholidays.ejcloud.net
    ```
5. Add ENV_SECRET_KEY passphare to the .env.local file, this passphare could be provided by the Capability Lead or could be found in the documentation.

### Development mode

1. Execute `npm run start:dev` or `npm run start:dev:watch`
2. Open [http://localhost:3000/en/holidays](http://localhost:3000/en/holidays)

|                   |                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| ` start:dev`      | generates `componentFactory.ts` only once                                                                     |
| `start:dev:watch` | regenerates `componentFactory.ts` whenever files are added or deleted in `src/frontend/components/renderings` |

### Production mode

1. Execute `npm run start:production` to create production build and start server.
2. Open [http://localhost:3000/en/holidays](http://localhost:3000/en/holidays).

### HTTPS Proxy

To serve local app via HTTPS:

1. Execute `npm run start:dev` or `npm run start:production`
2. Execute `npm run start:https-proxy`

Alternatively, you can run `npm run start:dev-proxy` which will run `npm run start:dev`, and once the server is up and running it will run `npm run start:https-proxy`.

3. Open [https://localhost:3001/en/holidays](https://localhost:3001/en/holidays).

Auth cookies will work only on [https://local.webdev.ejholidays.ejcloud.net:3001/en/holidays](https://web.local.holidays.easyjet.com:3001/en/holidays).

### Local environment overrides

To customize variables in the env.json configuration file for local development, you can create an `env.local.json` file. Any variables added to the "private" or "public" object in env.local.json will override the corresponding variables in env.json, while the remaining variables in env.local.json will still be used. This file is not tracked by Git.

Below is an example of an env.local.json overrides file for using the CI API URL and host 3001 on web.local to allow a HTTPS proxy.

```
{
    "private": {
        "SITECORE_URL": "https://cd-ci.webdev.ejholidays.ejcloud.net",
        "ORIGINAL_WEBAPI_URL": "https://ci.webdev.ejholidays.ejcloud.net/holidays/_api"
    },
    "public": {
        "WEBAPI_URL": "https://ci.webdev.ejholidays.ejcloud.net/holidays/_api",
        "PUBLIC_URL": "https://local.webdev.ejholidays.ejcloud.net:3001",
        "PAYMENT_ORIGIN": "https://ci.webdev.ejholidays.ejcloud.net/holidays/_api"
    }
}
```

These overrides allow you to specify different values for these variables during local development without modifying the shared env.json file.

### Local Experience Editor

To make local Experience Editor work do the following:

1. in file .env change IS_LOCAL_EXPERIENCE_EDITOR to true value

```
IS_LOCAL_EXPERIENCE_EDITOR=true
```

2. Restart the project

### Run in docker

Build image (run from the root of the repo due to dependency on the `Prototypes` project):

```
docker build -t web-frontend-local -f ./app_/Dockerfile .
```

Run image locally:

```
docker run --rm -it  -v ./app_/env.json:/mnt/efs/env.json -v ./app_/.env:/mnt/efs/.env.octopus -p 3000:3000 web-frontend-local
```

### How to configure Sonarlint with SonarCloud in VS Code

1. Install Sonarlint extension

2. Go to the View menu > Command Palette and type “SonnarLint: Connect to Sonarcloud”

3. On the New SonarCloud Connection tab, click on Generate Token. This will take you to the SonarCloud website.
   Click on Allow Connection and return to the IDE. The fields for 'Token', 'Organization', and 'Connection Name' will be automatically filled.

4. Click on Save Connection button.

5. Go to VS Code Configuration and type "SonarLint: connectedMode". Edit setting.json file and add the following:

    ```
    "sonarlint.connectedMode.connections.sonarcloud": [
        {
            "organizationKey": "easyjet-dev",
            "connectionId": "easyjet-dev"
        }
    ],
    "sonarlint.connectedMode.project": {

        "connectionId": "easyjet-dev",
        "projectKey": "easyjet-dev_ejh-web-digital_frontend"
    }

    ```

### How to Update the Encrypted File

1. Update Your Secrets:

    - Open your env.secrets.json file in your preferred text editor.
    - Modify, add, or remove secrets as needed.
    - Save the changes to the env.secrets.json file.

2. Encrypt the Updated Secrets:
    - Open your terminal or command prompt at project’s root directory.
    - Run CLI command:
    ```
    npm run encrypt-env <optional passphare if not present in .env.local>
    ```
3. Verify Encryption:
    - Check the console output to ensure that the encryption was successful.
4. Commit the Updated Encrypted File
