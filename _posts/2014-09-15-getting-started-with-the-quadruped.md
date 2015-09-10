---
layout: post
title: "Getting Started with the Quadruped"
date: 2014-09-15 11:37:01
image: '/assets/img/project_screenshots/quad.screenshot.png'
image-description: "Snapshot of the the development frame of the R. Links quadruped"
image-position: center
description:
tags:
- Quadruped
- Systems
- Hardware
- c++
categories:
- Projects
twitter_text:
---

## The Beginning

Development has begun on the R. Links project. The hardware was developed by Sam Zapolsky at the George Washington University. The goal is to give it a **brain**. Right now, the quadruped has a full setup of hardware and is even able to walk around using a tethered connection to a computer. Eventually it will be able to see and move on its own without direct programming.

## What is R.Links?

R. Links is a quadruped robot designed by Sam Zapolsky to be affordable and efficient. With a total cost to build of under $5K, the R. Links has  a Raspberry Pi-based computation stack, inertial measurement units, and Kinect time-of-flight sensor. The over-arching design and development of R. Links already has plans to [go through several iterations.](http://robotics.gwu.edu/positronics/?tag=quadruped) This iteration of the project will begin with the [Xtion Pro Live](http://www.asus.com/Multimedia/Xtion_PRO_LIVE/) (the Kinect-ish sensor being used). 

## The Proposal

A full project proposal has been developed for this project. This proposal was developed following the [NSF grant proposal guidelines](http://www.nsf.gov/pubs/gpg/nsf04_23/1.jsp). The proposal itself contains deeper details about the project and the approach taken to complete it. The gist of it is that there are not any affordable systems available with the sophistication of R. Links. This quadruped will have full capability to visualize its environment. I will be developing a library so that researchers and hobbyists alike will be able to build R. Links and immediately start to develop custom functionality without having to worry about creating a code base to interact with the various components. The best part of all is that all of this will be OPEN SOURCE! The design plans and the code itself will be available to anyone interested in working with the R. Links quadruped. The tentative release date for this library will be in mid 2015\. Hopefully, by then I will have developed a solid library that anyone can use as an interface for R. Links.