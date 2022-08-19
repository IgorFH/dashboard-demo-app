'use strict';

require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('vision');
const Handlebars = require('handlebars');
const AWS = require('aws-sdk');
const Path = require('path');

AWS.config.update({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' });

const init = async () => {

    const server = Hapi.Server({
        host: process.env.HOST || 'localhost',
        port: process.env.PORT || 3000,
        routes: {
            files: {
                relativeTo: Path.join(__dirname, 'views')
            }
        }
    });

    await server.register([
        { plugin: Inert },
        { plugin: Vision },
    ]);

    server.views({
        engines: {
            html: Handlebars
        },
        relativeTo: __dirname,
        path: 'views'
    });

    server.route([
        {
            method: 'GET',
            path: '/',
            handler: (request, h) => {
                return h.file('index.html');
            }
        },
        {
            method: 'POST',
            path: '/submit',
            handler: async (request, h) => {
                try {
                    if (request.payload.token === process.env.TOKEN) {
                        const roleCreds = {
                            accessKeyId: process.env.ACCESS_KEY_ID,
                            secretAccessKey: process.env.SECRET_ACCESS_KEY,
                        };

                        const quicksight = new AWS.QuickSight({ credentials: roleCreds, apiVersion: '2018-04-01', region: 'us-east-1' });

                        const quicksightParams = {
                            AwsAccountId: process.env.AWS_ACCOUNT_ID,
                            DashboardId: process.env.DASHBOARD_ID,
                            IdentityType: 'ANONYMOUS',
                            Namespace: 'default'
                        };
                        const dashboardUrl = await quicksight.getDashboardEmbedUrl(quicksightParams).promise();

                        return h.view('dashboard.html', {
                            url: dashboardUrl.EmbedUrl
                        });
                    } else if (request.payload.token === process.env.ACCOUNT_DASHBOARD_TOKEN) {
                        const roleCreds = {
                            accessKeyId: process.env.ACCESS_KEY_ID,
                            secretAccessKey: process.env.SECRET_ACCESS_KEY,
                        };

                        const quicksight = new AWS.QuickSight({ credentials: roleCreds, apiVersion: '2018-04-01', region: 'us-east-1' });

                        const quicksightParams = {
                            AwsAccountId: process.env.AWS_ACCOUNT_ID,
                            DashboardId: process.env.ACCOUNT_DASHBOARD_ID,
                            IdentityType: 'ANONYMOUS',
                            Namespace: 'default'
                        };
                        const dashboardUrl = await quicksight.getDashboardEmbedUrl(quicksightParams).promise();

                        return h.view('dashboard.html', {
                            url: dashboardUrl.EmbedUrl
                        });
                    }
                    else {
                        return h.file('403.html');
                    }
                }
                catch (err) {
                    console.error(err);
                }
            }
        },
        {
            method: 'GET',
            path: '/logo.png',
            handler: (request, h) => {
                return h.file('logo.png');
            }
        },
    ]);

    await server.start();
    console.log(`Server started on: ${server.info.uri}`);

}

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();
