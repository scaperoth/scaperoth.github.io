---
layout: post
title: "AWS Environment Variables with Docker & React"
date: 2019-03-1 12:15:31
image: '/assets/img/project_screenshots/reactdockerenv.screenshot.jpg'
image-description: "Screenshot of React AWS Docker Flow"
image-position: top
description: What I did to make environment variables configurable in React on  AWS EB
tags:
- React
- Node.js
- Docker
- NGINX
- Express
- AWS
categories:
- Hosting
twitter_text:
---

You can use an express server to write an .env file and build your React application with Node child process executing your commands. This allows you to bypass restrictions in Docker and AWS so that you can efficiently pull environment variables straight from the host.

Directory structure is something like this:

{% highlight bash %}
- Application
  - maintenance/
    - css/
    - images/
    ...
    - index.html
  - src/
  - public/
  ...
	- Dockerfile
  - app.config.js
  - server.js
  - write-env.js
  - package.json
  - yarn.lock

{% endhighlight %}

All the good stuff is in the <b>Setup</b> section if you aren't one of those "why would you ever do it this way" people and you just want to skip ahead.

### Requirements

- Node.js >= 10.12
- Docker
- AWS Elastic Beanstalk

### Fine Print

I am in no way endorsing this approach as the correct way to get dynamic environment variables into a React application. There are lots of better ways to do this that involve building on your machine. This is just something that I wish i had available when I was looking for a solution that fit my needs.

The main reason why this method was chosen was because it requires little to no understanding of how the environment variables are getting from one place to another. You just update the config file, use the variable in the code, and deploy.

### Background & Assumptions Made

Sometimes there are strange constraints on a project. I recently had one where the application was hosted on AWS Elastic Beanstalk with an NGINX configuration pointing to a Docker container that served up a React application. I don't care for anyone saying, "Why would you do that?" because that is probably the only stupid question that exists. What matters is that it had to be done.

The point here is that AWS Elastic Beanstalk does not let you determine the build step for your docker container so you are not able to do anything with the environment variables like you normally would on a local machine or some other hosting service using the docker CLI tools. This restriction combined with React's build step of removing and replacing environment variables with their values makes it difficult to inject any values from the outer host to the docker container without some other wrapping going on.

In this post, I will assume that you, the reader, are familiar with a few concepts: Docker, React, Express, Node.js, AWS, environment variables, .env files. If you are not familiar with one or more of these things, then you may be in the wrong place. This post is to help with a very specific scenario that has strict time constraints.

### The Setup

First, you will have some React application. Any ol' app will do. You can generate one with create-react-app or by downloading one from a repository. Doesn't really matter.

#### Dockerfile

Next, you will have a docker container that serves this application with a simple Dockerfile like the following:

{% highlight bash %}
FROM node:10.12
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app
COPY yarn.lock /usr/src/app

RUN yarn --silent

COPY . /usr/src/app

EXPOSE 3838

CMD ["yarn", "aws"]
{% endhighlight %}

You'll notice here that there are no ARGS or ENV calls. We are simply building out our application with Node v10.12 (or whatever you may be using), installing packages, opening port, and executing our launch script from the package.json file.

#### package.json

Your package.json file will look something like this:

{% highlight json %}
{
	"name": "some app name",
	"version": "1.0.0",
	"dependencies": {
		"express": "^4.16.4"
		...
	},
	"scripts": {
		"start": "yarn setup && react-app-rewired start",
		"aws": "node server.js",
		"build": "react-app-rewired build",
		"test": "react-app-rewired test --env=jsdom",
		"setup": "node write-env.js"
		...
	},
	"devDependencies": {
		"react-app-rewired": "^1.6.2",
		...
	}
}
{% endhighlight %}

> You don't have to use `react-app-rewired`, I just like being able to tweak some things without losing the ability to update.

So here we have express as a dependency which will act as a way to serve up the application, some scripts that will write a .env file, and a way to build our application. The purpose of this will be to run your scripts that will grab the environment variables and rebuild the react application while a maintenance mode screen is displayed.

#### app.config.js

First, let's take a look at a standard config file for React. This file will pull variables from the process.env and put them into values that React knows how to parse. This file will look like this:

{% highlight javascript %}
// app.config.js

module.exports = {
	REACT_APP_SOME_VARIABLE: process.env.SOME_VARIABLE || 'default value',
	...
	REACT_APP_SOME_OTHER_VARIABLE: process.env.SOME_OTHER_VARIABLE || 'default value'
}
{% endhighlight %}

This file will be written to a .env file and React will automatically pick up these values and place them into the running process.env. Once you're running your application, you can access any of these values with a line like:

{% highlight javascript %}
const someVariable = process.env.REACT_APP_SOME_VARIABLE;
{% endhighlight %}

Normally what would be done is that these .env would be created manually and passed around with different variables based on what build you were creating. These files would be secure, in the .gitignore, and packed up along with the deploy stage. Since we want to manage ours through AWS we don't do this.

#### write-env.js

{% highlight javascript %}
const fs = require('fs');
const appConfig = require('./app.config');

const writeEnv = (destination, filename, dataObj) => {
	let stringified = '';
	for(const key of Object.keys(dataObj)){
		let string = JSON.stringify(dataObj[key]);
		stringified += `${key}=${string}\n`;
	}

	const dir = destination;
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	const path = `${dir}/${filename}`;
	fs.writeFileSync(path, stringified);
};

writeEnv(__dirname, '.env', appConfig);

{% endhighlight %}

> Obviously this can be written a dozen ways, but this just happens to be the way I created it.

This file will take your app.config.js file mentioned above and put the `REACT_APP_` variables into a .env file for you. This way, you can access the exported environment variables from your server. As mentioned before, in the build step, React will automatically drop these values into your application so that you can access them.

#### server.js

Finally, for the server. This part is where it gets fun. And it's also the part that is the <i>MOST</i> hacky.

{% highlight javascript %}
const port = process.env.PORT || 3000;

const util = require('util');
const express = require('express');
const path = require('path');
const exec = util.promisify(require('child_process').exec);

// handle maintenance mode while building
const maintenance = express();
maintenance.use(express.static(path.join(__dirname, 'maintenance')));
maintenance.get('*', (req, res) => {
	// header for SEO
	res.set('Retry-After', 60);
	res.status(503).sendFile(path.join(__dirname, 'maintenance/index.html'));
});

const maintenanceMode = maintenance.listen(port, () => {
	console.log('Maintenance mode running on port %s', port);
});

if (process.env.MAINTENANCE_MODE !== 'true') {

	// build the actual thing if not in maintenance mode
	const app = express();

	console.log('prepping environment variables');
	exec('yarn setup').then(() => {
		exec('yarn build').then(() => {
			maintenanceMode.close();
			app.use(express.static(path.join(__dirname, 'build')));

			// Handles any requests that don't match the ones above
			app.get('*', (req, res) => {
				res.sendFile(path.join(__dirname, 'build/index.html'));
			});

			app.listen(port, () => {
				console.log('App running on port %s', port);
				// do something with listen
			});

		}).catch(err => {
			// handle error here
		});
	});
}
{% endhighlight %}

> I normally prefer async await for this type of thing. It can easily be rewritten to be an async function, but it just felt nice to have a promise chain controlling the flow of the build.

Here, we promisify the child process call with Node.js util so we can wait for them to be done and chain them together. Next, we set up maintenance mode no matter how long the build takes. This will display some nicely formatted maintenance screen that we can design independently of the application. Then we dump our environment variables into a .env file. Finally, we run the build step so that the application gets injected with all the nice things that we need like api tokens, dynamic links, image urls, etc.

You can also put in console logs here to have a nice record for debugging on AWS.

### Deploy

The nice thing about this setup is that you don't have any fancy commands to run or anything to maintain other than app.config.js. Thats it! You can just deploy to AWS through the CLI with a command like `eb deploy eb-target-name`. If you're not sure how to set up AWS CLI, it's easy to Google and they have lots of documentation on getting started.

### Conclusion

Sometimes you have to do <i>gross</i> things to get around constraints. Period. This is a quick and dirty way to serve up your React application while still having the flexibility of AWS-managed environment variables in an NGINX environment. It's easy for people to maintain and easy to deploy. And, in my opinion, that's half the battle.  
