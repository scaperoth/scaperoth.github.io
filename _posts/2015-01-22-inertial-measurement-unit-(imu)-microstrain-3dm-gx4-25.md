---
layout: post
title: "Inertial Measurement Unit (IMU) MicroStrain 3DM GX4-25"
date: 2015-01-22 09:48:28
image: '/assets/img/project_screenshots/imu.screenshot.png'
image-description: "Photo of the inertial measurement unit used"
image-position: center
description:
tags: 
- IMU
- Systems
- Hardware
- c++
categories: 
- Projects
twitter_text: 
---

> The customized code for the 3DM GX4-25 can be [found in GitHub](https://github.com/scaperoth/IMU-3DM-GX4-25/blob/master/MIP%20SDK/C/Examples/Linux/GX4-25/custom/).
 
For the telemetry data in [a quadruped project](http://scaperoth.com/?p=12757 "Getting Started with the Quadruped"), we are using a [MicroStrain 3DM GX4-25](http://www.microstrain.com/inertial/3dm-gx4-25). To get this device to work, you have to understand a few concepts built into the provided examples. The given example provides one large main function. I broke the functionality up for the sake of modulation in my code which can be found in github in the [data_test.c](https://github.com/scaperoth/IMU-3DM-GX4-25/blob/master/MIP%20SDK/C/Examples/Linux/GX4-25/custom/data_test.c) file. Getting the device to work in a c/c++ Linux environment is not very straightforward from the documents on the [MicroStrain site](http://www.microstrain.com/inertial/3dm-gx4-25). For example, if you want to capture scaled gyroscope or accelerometer values, you need to first define them in the [ahrs_packet_callback() function](https://github.com/scaperoth/IMU-3DM-GX4-25/blob/master/MIP%20SDK/C/Examples/Linux/GX4-25/custom/data_test.c#L575). There are constants that represent each type of value and these constants are used in the switch statement in this funciton. [Here is an example](https://github.com/scaperoth/IMU-3DM-GX4-25/blob/master/MIP%20SDK/C/Examples/Linux/GX4-25/custom/data_test.c#L609) of a declaration for the scaled accelerometer values:

{% highlight cpp %}
case MIP_AHRS_DATA_ACCEL_SCALED:
{
    memcpy(&curr_ahrs_accel, field_data, sizeof(mip_ahrs_scaled_accel));

    //For little-endian targets, byteswap the data field
    mip_ahrs_scaled_accel_byteswap(&curr_ahrs_accel);

} break;
{% endhighlight %}

There are a couple of important things to note in this code block. First, the MIP_AHRS_DATA_ACCEL_SCALED is the constant defined in the [mip_sdk_ahrs.h file](https://github.com/scaperoth/IMU-3DM-GX4-25/blob/b77769f8e8bff1f5031cee808e4df43ea30c6adf/MIP%20SDK/C/Library/Include/mip_sdk_ahrs.h). This is important only for identification, but it is also helpful to browse this file for the other definitions like delta velocity, delta acceleration, and internal timestamp data. Second, notice that the memcopy function is populating the shared variable, curr_ahrs_accel, and pulling the data from "field_data" with a specific size set by the mip_ahrs_scaled_accel. All these things are important because it tells  you where your data is coming from. Looking at this code you can assume that there's a variable (more specifically a struct with an array member) now called curr_ahrs_accel that you can access. The final byteswap, as it says in the comment, is for architectures that may prefer least significant endianness. [pullquote align="center"]So the big take-away here is that you can define a case in the switch statement that fits your needs and "memcopies" over the data that you want to use.[/pullquote] With this knowledge you can even group measurements together in your own data structure. For example, I may define my own structure called _mip_ahrs_telemetry like so:

{% highlight cpp %}
typedef struct _mip_ahrs_telemetry
{
    float gyro[3];
    float accel[3];
    float mag[3];
} MIP_AHRS_TELEMETRY;

//create a variable of this structure type
MIP_AHRS_TELEMETRY updated_telemetry;
{% endhighlight %}

Then I can [poll the data](https://github.com/scaperoth/IMU-3DM-GX4-25/blob/master/MIP%20SDK/C/Examples/Linux/GX4-25/custom/data_test.c#L48) according to the given api and documentation:

{% highlight cpp %}
while(mip_3dm_cmd_poll_ahrs(&device_interface, MIP_3DM_POLLING_ENABLE_ACK_NACK, data_stream_format_num_entries, data_stream_format_descriptors) != MIP_INTERFACE_OK) {}
{% endhighlight %}

and then move the data into my own variable inside of my structure:

{% highlight cpp %}
memcpy(&updated_telemetry.gyro, curr_ahrs_gyro.scaled_gyro, sizeof(curr_ahrs_gyro.scaled_gyro));
memcpy(&updated_telemetry.gyro_raw, curr_ahrs_gyro_raw.raw_gyro, sizeof(curr_ahrs_gyro_raw.raw_gyro));
memcpy(&updated_telemetry.accel, curr_ahrs_accel.scaled_accel, sizeof(curr_ahrs_accel.scaled_accel));
memcpy(&updated_telemetry.accel_raw, curr_ahrs_accel_raw.raw_accel, sizeof(curr_ahrs_accel_raw.raw_accel));
memcpy(&updated_telemetry.mag, curr_ahrs_mag.scaled_mag, sizeof(curr_ahrs_mag.scaled_mag));
memcpy(&updated_telemetry.mag_raw, curr_ahrs_mag_raw.raw_mag, sizeof(curr_ahrs_mag_raw.raw_mag));
{% endhighlight %}

Now you have a nice stucture that you can call to print out relevant data:

{% highlight cpp %}
printf("\accel 1, 2, 3: %f | %f | %f\n", updated_telemetry.accel[0], updated_telemetry.accel[1], updated_telemetry.accel[2]);
printf("\gyro 1, 2, 3: %f | %f | %f\n", updated_telemetry.gyro[0], updated_telemetry.gyro[1], updated_telemetry.gyro[2]);
printf("\mag 1, 2, 3: %f | %f | %f\n", updated_telemetry.mag [0], updated_telemetry.mag [1], updated_telemetry.mag [2]);
{% endhighlight %}

Credit: to the MicroStrain team for providing [great base code](http://www.microstrain.com/inertial/3dm-gx4-25) to work with. Note: The original source code can be downloaded from http://www.microstrain.com/inertial/3dm-gx4-25 under the MIP™ C Code Sample for Windows and Linux Version 1.1 link. The code to run is found under the MIP%20SDK/C/Examples/Linux/GX4-25/ path.