# Hyperdeck Controller
*by Floris Cnossen*

This repository contains an API written in Javascript with Express JS, for controlling a Blackmagic Hyperdeck. The Hyperdeck is being controlled via the [Hyperdeck JS Lib package](https://github.com/LA1TV/Hyperdeck-JS-Lib). 

Besides the control via TCP messages, there is also support for transfering files via FTP.

## Frontend
I developed a Vue Frontend application in a seperate repository: [Hyperdeck Controller Frontend](https://github.com/floscnos/hyperdeck-controller-frontend).


## Use Case
This project is started for a particular use case at a local Radio/TV station. There is need for playing a single clip in an infinite loop. About once a month, this single clip has to be updated. This can be done via the frontend application.

Because of this specific use case, I didn't take the effort to develop api endpoints for all recording possibilities of the Blackmagic Hyperdeck. Feel free to pull the repo and make a pull request to contribute.

## CI/CD
There is a pipeline configured for pulling the frontend, building it, and then pack everything together for publishing it as a Docker Container Image on the Github Container Registry.

By default this will resault in updating the ```:main``` tag. If you add a tag to a commit, starting with ```v```, this tag will be used as the tag for the container image.