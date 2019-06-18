---
layout: post
title: "Shiny and a Docker Container"
date: 2019-06-17 19:52:17
image: '/assets/img/project_screenshots/dockershiny.screenshot.png'
image-description: "Screenshot of Shiny app"
image-position: top
description: How I created a local R Shiny server using Docker that could be deployed worldwide
tags:
- R
- Docker
- Shiny
categories:
- Hosting
twitter_text:
---

> The code for this project can be <a href="https://github.com/scaperoth/shiny">found on GitHub</a>

Someone recently told me that they were interested in making a Shiny application that was portable so that anyone could grab a prebuilt image on a machine and deploy the application on their own servers. I thought this was an interesting challenge so I started to do some reading and found https://github.com/rocker-org/shiny. This is a well made/maintained repository that helps one create their own server using the docker image `rocker/r-ver:3.6.0` (or whatever R version they want).

## Let me back up

First, I think it's important to set up some definitions. If you're familiar with Docker, Shiny, and the whole stack here, then skip ahead.

The following are the tools we use here. To familiarize yourself with each once, I've included links to their websites that can explain what they do and how they do it a lot better than I would.

- [Shiny](https://shiny.rstudio.com/): "Shiny is an R package that makes it easy to build interactive web apps straight from R."
- [Docker](https://www.docker.com/why-docker): "A Docker container image is a lightweight, standalone, executable package of software that includes everything needed to run an application: code, runtime, system tools, system libraries and settings."

## Let's get started

First, I forked the Shiny repo so I could make some changes for my own benefit. My repository can be found [here](https://github.com/scaperoth/shiny).

It was easy to get everything set up once I had Docker installed. To learn how to do this, see the links above and make sure docker is added to your path.

- Navigate to the repository mentioned either in this section or in the introduction
- Either download the Zip file or clone the repository
- open a command line utility (command prompt on Windows or terminal on Mac/Linux)
- Change directories to the newly downloaded Shiny project
- Execute the next command to build the docker container
{% highlight bash %}
docker build --rm -t scaperoth/shiny .
{% endhighlight %}

This may take a while...

> Note: you can replace `scaperoth/shiny` with any name you like to tag your docker image file. Just make sure you use that same name in the next step

- I like to check my images once they are done with:
{% highlight bash %}
docker images
{% endhighlight %}

You should see your image at the top of the list

- Once that is done, run
{% highlight bash %}
docker run --rm -p 3838:3838 scaperoth/shiny
{% endhighlight %}

Now, you should be able to navigate to localhost:3838 and view your app.

## What is happening here?

For anyone curious, here's what's happening under the hood. First, you're copying the files from the repository. In these files is the all-important `Dockerfile`. This file, is used to tell Docker what to download and how to create itself. It's like a recipe for the image you're going to be creating. With this, docker will spin up a new container. Think of a container as a standalone operating system that share hardware with your host instead of virtualizing it (like a virtual machine).

The Dockerfile for this project looks like this:

{% highlight bash %}
FROM rocker/r-ver:3.6.0

RUN apt-get update && apt-get install -y \
    sudo \
    gdebi-core \
    pandoc \
    pandoc-citeproc \
    libcurl4-gnutls-dev \
    libcairo2-dev \
    libxt-dev \
    xtail \
    wget

# Download and install Shiny server
RUN wget --no-verbose https://download3.rstudio.org/ubuntu-14.04/x86_64/VERSION -O "version.txt" && \
    VERSION=$(cat version.txt)  && \
    wget --no-verbose "https://download3.rstudio.org/ubuntu-14.04/x86_64/shiny-server-$VERSION-amd64.deb" -O ss-latest.deb && \
    gdebi -n ss-latest.deb && \
    rm -f version.txt ss-latest.deb && \
    . /etc/environment && \
    R -e "install.packages(c('shiny', 'rmarkdown', 'tidyr', 'plyr', 'readr', 'ggvis'), repos='$MRAN')" && \
    cp -R /usr/local/lib/R/site-library/shiny/examples/* /srv/shiny-server/ && \
    chown shiny:shiny /var/lib/shiny-server

EXPOSE 3838

COPY shiny-server.sh /usr/bin/shiny-server.sh

CMD ["/usr/bin/shiny-server.sh"]
{% endhighlight %}

The first line "FROM rocker/r-ver:3.6.0" says which base image to download. It's giving you your base setup and foundation for your server.

The next install line gets the rest of the dependencies for your server so you have all the tools needed for Ubuntu, Shiny, and R.

After that, there is a large command that is setting up the final pieces. It downloads Ubuntu, does some cleaning up, installs Shiny, adds the packages you need, and updates permissions. the `\` just means a line break for cleaner code and the `&&` just means to do the next command when the previous one completes.

> Note: An important thing to notice about this line is that you can tell docker which R libraries to install. If you want to add a new library, just add it to the concatenated list after 'ggvis'.

Next, you tell the docker container to allow communication through the port 3838.

Then you copy the Shiny server script from the base image to the /usr/bin directory so that you can execute it on the final line.

Finally, you run the server and can access it from localhost:3838. EZPZ, right?

## Getting your own Shiny application on to this server

Here's the fun part. Once you have the docker files set up and everything ready to go, you can dump your own Shiny app onto this server.

If you've made it this far, this part is easy. From the command line, run the command that looks like this:

{% highlight bash %}
docker run --rm -p 3838:3838 -v \
	<absolute path to custom Shiny app>:/srv/shiny-server/  \
	scaperoth/shiny
{% endhighlight %}

What this is doing is the same as the above, but instead of the example app being run, you'll replace it with your own Shiny app. You just replace "<absolute path to custom shiny app>" with whatever absolute path to your application is. The absolute path will be something like <b>/Users/username/Desktop/my-shiny-project-folder</b> or <b>c:/Users/username/my-shiny-project-folder</b>
(I haven't tried the windows version yet so it may need some tweaking).

>Note: Here, you can also change the port, 3838, to something of your choosing. Also, you should change scaperoth/shiny to whatever you tagged your image with after the `-t` flag in the docker build stage

## How do I host this application so people can get to it?

This question can lead to a can of worms. For a proof-of-concept, you can do what I do and use [localtunnel.me](https://localtunnel.me). This free service opens up a connection to your computer on the exposed port from docker (the first number in the `3838:3838`). It requires [Node.js](https://nodejs.org/en/download/) and `npm`, and it is really great for testing out websites. Once you have that installed and the docker container running, you can open up a local tunnel from the command line with:

{% highlight bash %}
lt --port 3838
{% endhighlight %}

Replacing 3838 with whatever port you want if necessary or you can just leave it be. It will give you a url to go to that will map to your running docker container and VOILA! Pretty exciting, right?

![UML](../assets/img/ezpz.gif)

## Further reading

- <a href="https://www.bjoern-hartmann.de/post/learn-how-to-dockerize-a-shinyapp-in-7-steps/" target="_blank">I found another article</a> by Bjoern Hartmann that I like better than my own. It can fill in some of the holes that I left out. It's another great tutorial that doesn't require rocker-org/shiny repository, but does require you to create your own project and Dockerfile.

- The Docker documentation files are extremely helpful. Lots of people and organization use docker these days so there are lots of examples and things you can play with. Just ask and search around. You'd be surprised what you can find.

- It may be worthwhile to look into hosting docker containers. I've done this before pretty easily with services like Amazon Web Services (AWS), but I'm sure there are at least a dozen good choices here. You could google something like "How do I host my docker container" and follow the trail to get started.

- Also, you will want to make sure you know your Shiny app inside and out for this to really work. This way you can make sure you're installing all of the appropriate libraries. Also, when you go to check your application during testing, you can be sure if something is broken or not.
