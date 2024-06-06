require("voxels")

if arg[2] == "debug" then
    require("lldebugger").start()
  end
  
io.stdout:setvbuf("no")

function love.load()

    --Screen setup

    love.window.setFullscreen(true)
    
    love.window.setVSync(0)

    width = love.graphics.getWidth()
    height = love.graphics.getHeight()

    love.mouse.setPosition(width/2,height/2)
    love.mouse.setVisible(false)

    --Chunk variables

    chunkWidth = 100
    chunkHeight = chunkWidth
    maxDepth = 7
    size = 1
    u = 0
    v = 0

    --Movement variables

    speed = 3
    vertSpeed = 0

    wheld = 0
    sheld = 0
    aheld = 0
    dheld = 0

    theta = 0

    floor = 1.5

    cameraPos = {0,floor,0}
    cameraLook = {0,floor,0}

    --Shader/ canvas setup

    mainShader = love.graphics.newShader("voxels.frag")

    screen = love.graphics.newCanvas()
    noiseMap = love.graphics.newCanvas()

    --Generate noise
    
    love.graphics.setCanvas(noiseMap)

    for i = 0,width do
        for j = 0, height do
            love.graphics.setColor(love.math.random(),love.math.random(),love.math.random(),1)
            love.graphics.points(i,j)
        end
    end
    love.graphics.setColor(1,1,1,1)
    love.graphics.setCanvas()

    noise = love.graphics.newImage(noiseMap:newImageData())

    if (mainShader:hasUniform("noise")) then
        mainShader:send("noise",noise)
    end

    --Generate chunk

    voxelList = love.graphics.newCanvas(width,height)
    love.graphics.setCanvas(voxelList)

    createOctree(1,0,0,0,0,0)

    love.graphics.setColor(1,1,1,1)
    love.graphics.setCanvas()

    --Send data to shader

    voxelData = voxelList:newImageData()
    voxelImage = love.graphics.newImage(voxelData)
    if (mainShader:hasUniform("voxelList")) then
        mainShader:send("voxelList",voxelImage)
    end

    if (mainShader:hasUniform("chunkWidth")) then
        mainShader:send("chunkWidth",chunkWidth)
    end
    if (mainShader:hasUniform("chunkHeight")) then
        mainShader:send("chunkHeight",chunkHeight)
    end
    if (mainShader:hasUniform("depth")) then
        mainShader:send("depth",maxDepth-1)
    end
    if (mainShader:hasUniform("size")) then
        mainShader:send("size",size)
    end
end

function love.keypressed(key) 
    if key == "w" then
        wheld = 1
    end
    if key == "a" then
        aheld = 1
    end
    if key == "s" then
        sheld = 1
    end
    if key == "d" then
        dheld = 1
    end
    if key == "space" then
        if cameraPos[2] == floor then
            vertSpeed = 5 / size
        end
    end
    if key == "escape" then
        love.event.quit()
    end
end

function love.keyreleased(key)
    if key == "w" then
        wheld = 0
    end
    if key == "a" then
        aheld = 0
    end
    if key == "s" then
        sheld = 0
    end
    if key == "d" then
        dheld = 0
    end
end

function love.mousemoved(x,y,dx,dy)
    theta = theta + dx * .005 / size
    if (love.mouse.getX() >= .7 * width or love.mouse.getX() <= .3 * width) then
        love.mouse.setPosition(width/2,height/2)
    end
end

function love.update(dt)
    cameraPos[2] = cameraPos[2] + vertSpeed * dt
    if cameraPos[2] < floor then
        vertSpeed = 0
        cameraPos[2] = floor
    else
        vertSpeed = vertSpeed - 10 * dt / size
    end

    if wheld == 1 then
        cameraPos[3] = cameraPos[3] + math.sin(theta) * dt * speed
        cameraPos[1] = cameraPos[1] + math.cos(theta) * dt * speed
    end
    if aheld == 1 then
        cameraPos[3] = cameraPos[3] - math.cos(theta) * dt * speed
        cameraPos[1] = cameraPos[1] + math.sin(theta) * dt * speed
    end
    if sheld == 1 then
        cameraPos[3] = cameraPos[3] - math.sin(theta) * dt * speed
        cameraPos[1] = cameraPos[1] - math.cos(theta) * dt * speed
    end
    if dheld == 1 then
        cameraPos[3] = cameraPos[3] + math.cos(theta) * dt * speed
        cameraPos[1] = cameraPos[1] - math.sin(theta) * dt * speed
    end

    cameraLook[1] = cameraPos[1] - math.cos(math.pi - theta)
    cameraLook[2] = cameraPos[2]
    cameraLook[3] = cameraPos[3] + math.sin(math.pi - theta)

    --cameraPos = {1.5,1.5,-3}
    --cameraLook = {1.5,1.5,-2}

    mainShader:send("lookFrom",cameraPos)
    mainShader:send("lookAt",cameraLook)
end

function love.draw()
    love.graphics.setShader(mainShader)
    love.graphics.draw(screen)
end