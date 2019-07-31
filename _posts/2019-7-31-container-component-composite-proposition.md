---
layout: post
title: "A Proposition for Container, Component, Composite, HOC pattern"
date: 2019-07-31 8:30:00
image: '/assets/img/project_screenshots/ccchoc.screenshot.jpg'
image-description: "Wall of shipping containers"
image-position: top
description: Based on other articles and my own experience, I try to define a pattern that I've seen work for large applications that scale.
tags:
- React
- Node.js
- Javascript
categories:
- Design Pattern
twitter_text:
---

I aim to reinforce a design pattern that I've seen work in a production environment for a small or large application. The pattern is based on other articles on design patterns for React/Redux applications ([Smith](https://medium.com/@_alanbsmith/composite-component-pattern-6331ebcbe07b), [Abramov](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)). And like other articles, this one also will also recommend that anything written here should be taken with a grain of salt. No pattern fits all cases and this should be used as a conversation starter for developing a method that works best for you and your team. Like Dan Abramov says, "don't take it too seriously."

## The Problem Space

There is almost always a time when a team starts writing an application that things start to become difficult to manage. The code and organization always starts nice, but once more team members or tighter deadlines appear, rules/guidelines start to be broken and the codebase is left hard to maintain and filled with workarounds that only a few people know how to deal with.

I do not think that any pattern out there will actually solve the problems of scope creep and constantly changing requirements, there are ways to help mitigate this issue with design patterns that are easy to understand and implement. They can, will, and should be broken from time to time, but it is always a great asset to have a structure to point to and say, "this is our goal."

Specifically, this article will talk about implementation within a React application. This does not mean that the pattern mentioned here is strictly a React, or even Javascript, thing. The Container, Component, Composite, HOC pattern can be and has been used in other areas and languages like C#, Java, and other OOP languages.

## Concepts

I will talk about things that lots of other, more eloquent, writers have defined in great length. I recommend that if you find anything confusing or new, most of the terms I use here should be pretty standard and easy to find explained in full.

*Containers*: Containers will be, as recommended by the creators of Redux, a dumb injector. The Containers will have functions and data that are required for the page, act as a placeholder for the structure, and have as little presentational value as possible.

*Components*: Components, like other articles have mentioned, will be nearly atomic levels of UI. Depending on this application, it could mean that a Component is a button, input, title, parallax image, etc. It can be anything that needs just a little bit more control than regular HTML/JSX tags.

*Composites*: Composites may be under a different name somewhere else and will be the least standard word in this article, but the name is derived from the idea of a composition of components. Composites act as the next step from Components and are much more specific to a Container.

*HOC*: HOCs are regular Higher Order Components. They can be used for wrapping Composites in reused behaviors. These behaviors may be CRUD operations that are found in several spots on the page, authentication for secured pages, or any other type of behavior that needs to be DRY and reusable.

## The Structure

This section will be mostly for Javascript and React applications, but the organization could be applied to other languages or projects.

Here, we will imagine a layout for a simple blog site. It will show posts on the home page and then you can click on the post to view the full content.

{% highlight bash %}
├ src/
| ├ Components/                
| | ├─ Button.css               
| | ├─ Button.js              
| | ├─ Image.css               
| | └─ Image.js
| ├ Composites/             
| | ├─ Post.css             
| | ├─ Post.js              
| | ├─ PostPreview.css             
| | ├─ PostPreview.js            
| | ├─ Posts.css             
| | ├─ Posts.js             
| ├ Containers/           
| | ├─ HomePage.css
| | ├─ HomePage.js           
| | ├─ PostPage.css
| | ├─ PostPage.js               
| | └─ index.js             
| ├ HOC/             
| | └─ WithCRUDPost.js      
{% endhighlight %}

From this structure, the idea is that the containers will contain all of the logic (outside of things in the HOC). The container will then inject the necessary information -- such as list of posts -- to the composite. The composite will then either use another composite or the components to create its layout.

Components should always be functional components. Composites could be either functional, pure, or regular components depending on what they need to do.

## The Implementation

To understand better, this section will show how the files in the folder structure could be implemented at a high-level.

First, this is how a team may develop the `HomePage.js` could be created:

{% highlight jsx %}
// app/src/Containers/HomePage.js

import React, { Component } from 'react';
import Posts from '../Composites/Posts';
// ... other imports

import './HomePage.css';

class HomePage extends Component {
  state = {
    // ... some state values
  }

  componentDidMount = () => {
    // ... something done on mount
  }

  render = () => (
    <div id={'home-page'}>
      <PageHeader/>
      <Posts list={this.state.posts}/>
      <Footer/>
    </div>
  )
}

export default HomePage;

{% endhighlight %}

And that's it. Keep the container as simple as possible for rendering. More logic could be added for manipulating state or forms or whatever needed to be done, but the render function should remain small if it's going to be in your container because it is not a presentational feature.

Drilling down to the `Posts.js` file may look something like this

{% highlight jsx %}
// app/src/Composites/Posts.js

import React, { Component } from 'react';
import PostPreview from '../Composites/PostPreview';

import './Posts.css';

class Posts extends Component {

  // controls specific to posts here

  render = () => (
    <div className={'posts'}>
      <div className={'post-list'}>
      {
        this.props.list.map(p => (
          <PostPreview key={p.id} title={post.title} image={post.image} content={post.content}/>
        ))
      }
      </div>
    </div>
  )
}

export default Posts;

{% endhighlight %}

Now we are seeing the drill down start to happen. The posts will render the preview which will have the WithCRUDPost HOC attached to it.


{% highlight jsx %}
// app/src/Composites/PostPreview.js

import React, { Component } from 'react';

import WithCRUDPost from '../HOC/WithCRUDPost';
import Image from '../Components/Image';
import Button from '../Components/Button';

import './PostPreview.css';

class PostPreview extends Component {

  // controls specific to post preview here

  render = () => (
    <div className={'post-preview'}>
      <div className={'post-preview-controls'}>
        // control structures go here that would use the
        // HOC functions that would be passed in
        // through the props. These could be used
        // to manipulate post based on user type or
        // social media functionality such as liking,
        // loving, upvote, downvote, etc.
      </div>
      <h1 className={'post-preview-title'}>{this.props.title}</h1>
      <Image src={this.props.image} alt={'Post Preview'}/>
      <p className={'post-preview-content'}>{this.props.content}</p>
			<Button>Call to Action!</Button>
    </div>
  )
}

export default WithCRUDPost(PostPreview);

{% endhighlight %}

Now a flow is set up from the container, to the composite, to the component. Each is separate and can be tested. The components used here are generic and can be changed site-wide. The image could have rounded borders or be parallax or could have different props to make it work throughout the site. The Button could change in size, color, behavior. All without getting confused with the Composite that uses these atomic structures.

The other important thing that I will not go into too much detail about is the HOC. Having a HOC on the post and post preview make them very different behaviorally from the Components. There is logic here that is shared and injected into each Composite.

## Conclusion

Of course, this structure could easily be collapsed to get rid of composites and put Posts and Post into the Components category. The goal of this structure is to neatly compartmentalize, not just the different layers of rendering, but the different behavioral patterns.

Someone can look at a file in Composites and, without looking at the code, know that it is going to be made of Components and possibly have some logic embedded. On the other hand, if someone is looking at a Component, they will be aware that this is an atomic structure that defines the overall look and feel of the site.

The proposed structure is a simple solution to the problem of compartmentalization that I have seen crop up again and again. When there are 50-100 components int he Components folder, it is difficult to know which one is made of other elements and which ones are simple functional rendering structures.

As always, do what works for you!
