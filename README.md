# README

This document explains how to setup Speech Translation API and use it in your AWS environment.

## Setup

Setting up the Speech Translation API requires you to add an _interface endpoint_ in your AWS account.
An interface endpoint provides a private connection between your VPC and our service (the API).
This can be done either using the UI or the command line. Before you can perform the steps you will need a service name which will be provided by us.

### Using the UI

The steps to do this are documented on AWS [here](https://docs.aws.amazon.com/vpc/latest/privatelink/create-interface-endpoint.html#create-interface-endpoint-aws) and copied below for reference. Note the highlighted **_tweaks_** you must perform:

Open the Amazon `VPC` console at https://console.aws.amazon.com/vpc/.

In the navigation pane, choose `Endpoints`.

Choose `Create endpoint`.

For Type, choose **Endpoint services that use NLBs and GWLBs** (last option).

(Optional) If creating an endpoint to an AWS service in another Region, select the Enable cross Region endpoint checkbox and then select the service region from the drop down.

For Service name, **enter the service name provided to you by us**. Click on **Verify service**.

![alt-text](images/image2.png)

For VPC, select the VPC from which you'll access the AWS service. Provision a new VPC if you like.

Optional: Enable Private DNS. This will allow you to connect to the service using a short URL. It is not necessary to enable this.

For Subnets, select the subnets from which you will access the API. You can select one subnet per Availability Zone. You can't select multiple subnets from the same Availability Zone. For more information, see Subnets and Availability Zones. _You must select at least one subnet_.

By default, we select IP addresses from the subnet IP address ranges and assign them to the endpoint network interfaces. To choose the IP addresses yourself, select Designate IP addresses. Note that the first four IP addresses and the last IP address in a subnet CIDR block are reserved for internal use, so you can't specify them for your endpoint network interfaces.

For IP address type, choose from the following options:

IPv4 – Assign IPv4 addresses to the endpoint network interfaces. This option is supported only if all selected subnets have IPv4 address ranges and the service accepts IPv4 requests.

IPv6 – Assign IPv6 addresses to the endpoint network interfaces. This option is supported only if all selected subnets are IPv6 only subnets and the service accepts IPv6 requests.

Dualstack – Assign both IPv4 and IPv6 addresses to the endpoint network interfaces. This option is supported only if all selected subnets have both IPv4 and IPv6 address ranges and the service accepts both IPv4 and IPv6 requests.

For Security groups, select the security groups to associate with the endpoint network interfaces. By default, we associate the default security group for the VPC.

For Policy, to allow all operations by all principals on all resources over the interface endpoint, select Full access. To restrict access, select Custom and enter a policy. This option is available only if the service supports VPC endpoint policies. For more information, see Endpoint policies.

(Optional) To add a tag, choose Add new tag and enter the tag key and the tag value.

Choose `Create endpoint`.

This will create an endpoint and send us a request to approve it.

![alt-text](images/image3.png)

_Wait for the request to be approved before proceeding to the next section._

Below is example of a successfully created Endpoint. Note the Endpoint type is **interface**.

![alt-text](images/image1.png)

### Using the command-line

To create an interface endpoint using the command line refer [create-vpc-endpoint (AWS CLI)](https://docs.aws.amazon.com/cli/latest/reference/ec2/create-vpc-endpoint.html).

### Making changes to existing endpoint

To configure an existing interface endpoint refer [this](https://docs.aws.amazon.com/vpc/latest/privatelink/interface-endpoints.html) guide.

## Test

To test the API provision an EC2 Instance in the **same** VPC and subnet that you used in the Setup and use the **same** SG.

Then copy over the code in this repository together with the sample `LJ_eng.wav` file to the EC2 Instance.

Install latest Node.js using [nvm](https://github.com/nvm-sh/nvm).

Install all the dependencies:

```
npm i
```

and edit `index.js` replacing the `BASE_URL` as appropriate:

```
const BASE_URL = "http://api.nuvoice.ai:8000";
```

You can find the domain part of the URL from `VPC -> Endpoints` in AWS dashboard. Select the endpoint you created in the Setup section.

Also change the `targetLanguage` to whatever you like:

```
let targetLanguage = "hin";
```

You can get list of supported languages by running:

```
curl http://api.nuvoice.ai:8000/languages
```

from the command line.

Running the sample should translate the given audio clip in English to the `targetLanguage` and save it as `test.wav`.

Below is sample output from a test run:

```
$ node index.js
start offset =  0
length =  485430
Sample rate: 16000
Number of channels: 1
Samples in first channel: 121343
connected
sending  121343  samples to the API
{
  text: 'विशेषज्ञों की जांच और गवाही ने आयोग को यह निष्कर्ष निकालने में सक्षम बनाया कि पांच गोलीबारी की गई हो सकती है।',
  target_language: 'hin',
  state: 'some state'
}
received translated audio
```

Stay tuned as we update the docs with more information and samples.