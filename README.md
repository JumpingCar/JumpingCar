# JumpCar

<img src="https://i.imgur.com/gZUgufI.png" width="400">

A driving simulation using neural networks and genetic algorithm

This project is for the 3rd week of **KAIST CS496 Immersion Camp: Intensive Programming and Startup**.

## Motivation
Not knowing a single thing about AI nor neural networks, we thought that it would be fun to implement neural networks from scratch and apply it to a simulation. This is the main simulation that we applied our neural networks library to. Check out [this side project](https://github.com/JumpingCar/JumpingBird) as well.

## About
The objective of this simulation is to generate units that drive for as far as it can. Every unit has its own neural network, making decisions which way to go on every frame. 

## How to use
Run the below command.   


    npm i
    npm run dev

### Random Map Generation
Maps are randomly generated on every refresh utilizing the gift wrapping algorithm. Eventually, the map is defined as a set of points, which can be freely exported and imported from and to the project at any time.

### Neural Network
Although many variations exist even within the project, the neural network accepts 9 inputs from its sensors at different angles, and produces 3 outputs, each of them representing left, right and straight respectively.

### Next Generation
The production of the next generation of units is an important part of the process. Assuming that there are 100 units per generation, the next generation contains:
* 8 parents with the highest fitness
* 12 units with randomly initialized neural networks
* 20 offsprings, with soft mutation
* 20 offsprings, with hard mutation
* 40 offsprings, without any mutation

### Export / Import
This project allows users to import and export genetic information of the current population / map at ease. This way users can test the population on another map, or test the map on another population.

## Tools We've Used
* Typescript
* React
* p5.js
* Webpack
* ESLint
* Babel

## Contributors
* [Juhyeong Sun](https://github.com/Sunjuhyeong)
* [Paco Kwon](https://github.com/pacokwon)
