---
layout: post
title: "Pistachio L4ka"
date: 2014-09-19 11:07:04
image: '/assets/img/project_screenshots/mukernel.screenshot.png'
image-description: "Image showing structure of a micro kernel"
image-position: center
description:
tags:
- Systems
- Micro Kernels
- Pistachio
categories:
- Projects
twitter_text:
---

Over the summer I've been working with microkernels (a.k.a. μ-kernels).  It took some time before I understood what a  μ-kernel was, and I'm still constantly learning. In short, a μ-kernel is a kernel that has been stripped down to where all components that aren't necessary in the kernel are moved out into user space. The obvious exceptions being components that are needed for security and kernel functionality like IPC, scheduling, memory, etc. One of the first actually usable microkernels was second generation L4 family developed by [Jochen Liedtke](http://en.wikipedia.org/wiki/Jochen_Liedtke). He wrote L4 by hand in assembly language! In the time since Jochen Liedtke, work has been done to improve the speed of these efficient kernels and there have been quite a few implementations. The first kernel I worked with is called [Pistachio](http://www.l4ka.org/65.php). [blockquote id="" class="" style="" align="right" author="Jochen Liedtke " affiliation="" affiliation_url=""]IPC performance is the Master. Anything which may lead to higher IPC performance has to be discussed. In case of doubt, decisions in favor of IPC have to be taken. But the performance and security qualities of other components must not be seriously impacted.[/blockquote]

## Pistachio L4Ka

To quote the Pistachio website, "L4Ka::Pistachio is the latest L4 microkernel developed by the [System Architecture Group](http://os.ibds.kit.edu/ "externer Link: http://os.ibds.kit.edu/") at the University of Karlsruhe in collaboration with the [DiSy group](http://www.disy.cse.unsw.edu.au/ "externer Link: http://www.disy.cse.unsw.edu.au/") at the University of New South Wales, Australia." It was made completely from scratch and released in 2001. I've heard Pistachio referred to as a full-on speed demon. The IPC in Pistachio for a single message register [is reported as taking](https://www.l4ka.org/126.php) around 120 cycles for intra address space communication and 250 cycles for inter address space communication. If I'm not mistaken, this is crazy fast. Other features I was interested in were memory mapping and cross socket communication, but I never did get the chance to thoroughly test out these last components. Pistachio has a great reference manual that thoroughly explains the system and the API. Personally, I thought the API was well written and easy to use. If you want to set  the processor number for a thread to run on: [code] <span class="n">L4_Set_ProcessorNo</span> <span class="p">(</span><span class="n">pong_tid</span><span class="p">,</span> <span class="p">(</span><span class="n">L4_ProcessorNo</span><span class="p">()</span> <span class="o">+</span> <span class="mi">1</span><span class="p">)</span> <span class="o">%</span> <span class="mi">2</span><span class="p">);</span>[/code] And that's it. No permissions, no work-arounds. This is typical of microkernel functionality, but Pistachio helped make it easier with an easy to understand API.

## Try It Out

[caption id="attachment_12902" align="alignleft" width="300"][![The numbers in the above image are obviously the result of some of my own broken configuration or code. But it gives an example of output from a custom module for Pistachio L4Ka running on bare metal.](http://scaperoth.com/wp-content/uploads/2014/09/image2-300x225.jpg)](http://scaperoth.com/wp-content/uploads/2014/09/image2-e1411085215831.jpg) The numbers here are obviously incorrect, but it gives an example of custom output Pistachio L4Ka running on bare metal.[/caption] During my work with Pistachio, I wasn't able to get those numbers on the bare metal. You can see an example of this output from the image at the top here. I am pretty sure I was messing up the configuration somewhere or had an error in my custom pingpong module. My goal was to find out how scalable Pistachio is so that we could compare other systems. The system I wanted to test on has a staggering 40 cores. This sounds great on paper, but apparently all kinds of madness can happen when you have that many cores. My code for Pistachio can be found on [GitHub](https://github.com/scaperoth/pistachio-qemu/blob/master/mscapero.org). Here I'll walk through what the instructions on GitHub also say. [pullquote]Note that these instructions only directly apply to the repository linked on this page. More detailed instructions can be found on the main [Pistachio site](http://www.l4ka.org/120.php).[/pullquote] in the “kernel/” folder, run [code] make BUILDDIR=$(pwd)/../x86-kernel-build [/code] [code]cd ../x86-kernel-build[/code] [code]make menuconfig[/code] choose your options (see configuration section) [code]make[/code] [code]mkdir ../x86-x32-user-build/[/code] [code]mkdir ../x86-x32-user-install/[/code] [code]cd ../user[/code] [code]autoconf[/code] [code]cd ../x86-x32-user-build/[/code] [code]autoheader ../user/configure.in[/code] [code]autoconfig ../user/configure.in[/code] [code]../user/configure –prefix=$(pwd)/../x86-x32-user-install –with-kerneldir=../x86-kernel-build –without-comport[/code] [code]make[/code] [code]make install[/code] if using this repo [code]cd ../../[/code] (using the top level makefile from this repository)[code]make[/code] otherwise follow instructions at [http://www.l4ka.org/120.php](http://www.l4ka.org/120.php) starting at Booting and Running

### Configuration in menuconfig:

*   Hardware
    *   x86 Basic Architecture
    *   32-bit
    *   Pentium 4
    *   Multiprocessor Support
    *   40 Max number of CPUs
*   Kernel
    *   Fast IPC Path
    *   Enable Spin Wheels
    *   New mapping database
    *   Use a non-virtual linear array for TCB management

From here you can install the image onto a bootable USB or run it from the makefile using an emulator like QEMU.