import { ExtendedObject3D, PhysicsLoader, Project, Scene3D, } from "enable3d"
import { IVehicle, SimpleVector } from "../models/IVehicle"
import { addControls, VehicleControls, } from "../utils/controls"
import { NormalVehicle } from "../models/NormalVehicle"
import * as THREE from '@enable3d/three-wrapper/dist/index';
import { PerspectiveCamera } from "three"
import { Socket } from "socket.io-client"
import { IPlayerInfo } from "../classes/Game"
import { SimpleCourt, SimpleCourtSettings, } from "../shared-game-components/squaredCourse"

const speedometer = document.getElementById("speedometer")
const positionInfo = document.getElementById("position-info")


const team1Color = "red"
const team2Color = "blue"

const numDecimals = 2
const getSimpleVectorString = (vec: SimpleVector) => {
  if (!vec) return ""
  return `x: ${vec.x.toFixed(numDecimals)} y: ${vec.y.toFixed(numDecimals)} z: ${vec.z.toFixed(numDecimals)}`
}

const simpleVecDistance = (vec1: SimpleVector, vec2: SimpleVector) => {
  const x = vec1.x - vec2.x
  const y = vec1.y - vec2.y
  const z = vec1.z - vec2.z
  return Math.sqrt((x * x) + (z * z) + (y * y))
}


export class PhysicsTest extends Scene3D {



  ball!: ExtendedObject3D

  playerNumber!: number
  players!: IPlayerInfo[]
  vehicles!: IVehicle[]
  font?: THREE.Font
  hasGoalScored = false
  textMesh?: any
  socket!: Socket
  vehicleControls!: VehicleControls
  isLeader!: boolean

  court!: SimpleCourt


  async init() {
    speedometer?.setAttribute("style", "display:block")
    positionInfo?.setAttribute("style", "display:block")
    this.renderer.setPixelRatio(1)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }


  async create() {
    await this.loadFont()

    this.createVehicles()

    this.physics.debug?.enable()
    //this.physics.debug?.mode(2048 + 4096)
    this.warpSpeed("-ground")


    const bricks = await this.load.texture("textures/bricks.jpg")
    bricks.wrapS = bricks.wrapT = 1000 // repeat
    bricks.offset.set(0, 0)
    bricks.repeat.set(50, 50)
    bricks.needsUpdate = true

    const courtSettings = new SimpleCourtSettings()
    this.court = new SimpleCourt(this, courtSettings)
    this.court.createGoals()
    this.court.createCourt(bricks)


    this.camera.position.set(0, 9, -23)


    this.ball = this.physics.add.sphere({ y: 10, z: -5, mass: 10 }, { lambert: { color: "yellow" } })
    this.ball.body.setBounciness(1)



    document.addEventListener("keypress", (e) => {
      if (e.key === "b") {
        // this.vehicle = createNormalVehicle(this, team1Color, "player1", this.font!)
        // this.vehicle.addCamera(this.camera)
        // this.players.push(this.vehicle)
      }
      else if (e.key === "r") {
        for (let i = 0; i < this.vehicles.length; i++) {
          this.vehicles[this.playerNumber].setPosition((Math.random() * 50 - 25), 10, 0)
          this.vehicles[this.playerNumber].setRotation(0, 0, 0)

        }
      }
    })

    window.addEventListener("resize", this.onWindowResize)
    this.createController()

    this.setupServerPositionListener()
  }



  setupServerPositionListener() {
    this.socket.on("server-position", (data: any) => {
      const serverPosition = data.position.position
      const localPosition = this.vehicles[this.playerNumber].getPosition()
      const serverRotation = data.position.rotation
      const localRotation = this.vehicles[this.playerNumber].getRotation()
      const positionDelta = simpleVecDistance(localPosition, serverPosition)
      const rotationDelta = simpleVecDistance(localRotation, serverRotation)

      // if (positionDelta > 15 || rotationDelta > 5) {
      //   this.vehicles[this.playerNumber].setPosition(serverPosition.x, serverPosition.y, serverPosition.z)
      //   this.vehicles[this.playerNumber].setRotation(serverRotation.x, serverRotation.y, serverRotation.z)
      //   console.log("delta too big", positionDelta)
      //   console.log("rotation dleta", rotationDelta)
      // }

      if (positionInfo) {
        positionInfo.innerHTML = "Location <br> server: "
          + getSimpleVectorString(serverPosition)
          + "<br> local: " + getSimpleVectorString(localPosition)
          + "<br> delta: " + positionDelta.toFixed(2)
          + "<br> Rotation <br> server: "
          + getSimpleVectorString(serverRotation)
          + "<br> local: " + getSimpleVectorString(localRotation)
          + "<br> delta: " + rotationDelta.toFixed(2)
      }
    })
  }

  onWindowResize() {
    if (this.camera.type === "PerspectiveCamera") {
      (this.camera as unknown as PerspectiveCamera).aspect = window.innerWidth / window.innerHeight;
    }
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setupNewPositionListener() {
    this.socket.on("new-position", (data) => {
      console.log("new positon")
    })
  }

  setSocket(socket: Socket) {
    this.socket = socket
  }

  createController() {
    this.vehicleControls = new VehicleControls()
    addControls(this.vehicleControls, this.socket, this.vehicles)
    // driveVehicle(this.vehicleControls,this.player[i].mobie)
  }

  getAllPlayersPositions() {
    const playersPositions = {}

    for (let i = 0; i < this.players.length; i++) {
      const pn = this.players[i].playerNumber
      const pos = {
        position: this.vehicles[pn].getPosition(),
        rotation: this.vehicles[pn].getRotation()
      }
      playersPositions[pn] = pos
    }
    return playersPositions
  }

  update() {
    this.vehicles[this.playerNumber].cameraLookAt(this.camera)
    for (let i = 0; i < this.vehicles.length; i++) {
      this.vehicles[i].update()
    }
    const speed = this.vehicles[this.playerNumber].getCurrentSpeedKmHour()
    if (speedometer) {
      speedometer.innerHTML = (speed < -0.5 ? '(R) ' : '') + Math.abs(speed).toFixed(1) + ' km/h';
    }
    this.checkIfBallOutOfBounds()
    this.checkIfGoal()

    if (this.isLeader) {
      const playersPositions = this.getAllPlayersPositions()
      this.socket.emit("player-position", { playersPositions })
    }
  }


  goalWasScored(goalScoredOn: number) {
    if (this.font) {

      const textPosZ = goalScoredOn === 1 ? this.court.goalDepth - 5 : -this.court.goalDepth + 5

      const textGeo = new THREE.TextGeometry("GOAL", {
        font: this.font,
        size: 8,
        // bevelThickness: 0.1
        height: 1
      })
      textGeo.computeBoundingBox();
      this.textMesh = new THREE.Mesh(textGeo, new THREE.MeshLambertMaterial({ color: 0xee11ee }))
      this.textMesh.position.x = 15
      this.textMesh.position.y = 3
      this.textMesh.position.z = textPosZ
      this.textMesh.rotateY(Math.PI)
      this.add.existing(this.textMesh)
    }

    // texture in 2d space

    setTimeout(() => {
      console.log("three sec lated")
      this.hasGoalScored = false
      this.scene.remove(this.textMesh)
      this.resetBall()
      this.resetPlayers()
    }, 3000)
  }



  checkIfGoal() {
    if (!this.hasGoalScored) {

      const goalScoredOn = this.court.checkIfGoal(this.ball)

      if (goalScoredOn === 1 || goalScoredOn === 2) {
        this.hasGoalScored = true
        this.goalWasScored(goalScoredOn)
      }
    }
  }

  checkIfBallOutOfBounds() {
    if (this.court.checkIfObjectOutOfBounds(this.ball.position)) {
      this.resetBall()
    }
  }


  resetPlayers() {
    for (let i = 0; i < this.vehicles.length; i++) {
      this.vehicles[i].setPosition((Math.random() * 100) - 50, 0, (Math.random() * 100) - 50)
    }
  }

  resetBall() {
    this.ball.remove()
    this.scene.remove(this.ball)
    this.physics.destroy(this.ball)
    this.ball = this.physics.add.sphere({ y: 10, z: -20, mass: 100 }, { lambert: { color: "yellow" } })
    this.ball.body.setBounciness(0.5)
    console.log("out of bounds")
  }



  setPlayers(players: IPlayerInfo[], playerNumber: number) {
    this.players = players
    this.playerNumber = playerNumber
    this.isLeader = this.players[playerNumber].isLeader
  }

  createVehicles() {
    this.vehicles = []
    for (let i = 0; i < this.players.length; i++) {
      const color = this.players[i].playerNumber === 1 ? team1Color : team2Color
      this.vehicles.push(new NormalVehicle(this, color, this.players[i].playerName))
    }
    this.vehicles[this.playerNumber].addCamera(this.camera)
  }

  createGoals() {

  }

  async loadFont() {
    const fontName = "helvetiker"
    const fontWeight = "regular"
    const loader = new THREE.FontLoader();
    loader.load('fonts/' + fontName + '_' + fontWeight + '.typeface.json', (response) => {

      this.font = response;
      if (this.font) {

        for (let i = 0; i < this.vehicles.length; i++) {
          this.vehicles[i].setFont(this.font)
        }
      }
    });
  }
}


export const startGameMultipleMonitors = (socket: Socket, players: IPlayerInfo[], playerNumber: number) => {
  const config = { scenes: [PhysicsTest], antialias: true, }
  PhysicsLoader("/ammo", () => {
    const project = new Project(config)
    console.log("project", project)
    console.log("project.scenes[0]", project.scenes)
    console.log("project.scenes[0]", project.scenes.keys().next().value)

    const key = project.scenes.keys().next().value;

    (project.scenes.get(key) as PhysicsTest).setSocket(socket);
    (project.scenes.get(key) as PhysicsTest).setPlayers(players, playerNumber);
    return project
  })

}
