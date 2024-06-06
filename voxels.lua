function createOctree(depth,x,y,z,newU, newV)

    love.graphics.setColor(1,1,1,1)

    for i=1,8 do
        newX = x+((i+1)%2)/math.pow(2,depth)
        newY = y+(math.floor((i+1)/2)%2)/math.pow(2,depth)
        newZ = z+math.floor((i-1)/4)/math.pow(2,depth)

        midX = newX + 1/math.pow(2,depth+1)
        midY = newY + 1/math.pow(2,depth+1)
        midZ = newZ + 1/math.pow(2,depth+1)

        xLim = newX + 1/math.pow(2,depth)
        yLim = newY + 1/math.pow(2,depth)
        zLim = newZ + 1/math.pow(2,depth)

        --Fill in u and v modifiers
        uModifier = (i-1)%4
        vModifier = math.floor((i-1)/4)
        --Test sphere-cube intersection with current newX, newY, newZ + 1/2^D if true then continue

        distanceSquared = math.pow(.5,2)
        if .5 < newX then
            distanceSquared = distanceSquared - math.pow(.5-newX,2)
        elseif .5 > xLim then
            distanceSquared = distanceSquared - math.pow(.5-xLim,2)
        end
        if .5 < newY then
            distanceSquared = distanceSquared - math.pow(.5-newY,2)
        elseif .5 > yLim then
            distanceSquared = distanceSquared - math.pow(.5-yLim,2)
        end
        if .5 < newZ then
            distanceSquared = distanceSquared - math.pow(.5-newZ,2)
        elseif .5 > zLim then
            distanceSquared = distanceSquared - math.pow(.5-zLim,2)
        end

        --if distanceSquared > 0 then
        if math.floor(newX * 64) % 2 == 0 then
            if depth + 1 == maxDepth then
                love.graphics.setColor(i%2,1,1,.5)
                love.graphics.points(newU * 4 + uModifier + .5,newV * 2 + vModifier + .5)
            else
                u = (u + 1)%256
                if u == 0 then
                    v = v + 1
                end
                love.graphics.setColor(u/255.0,v/255.0,0,1)
                love.graphics.points(newU * 4 + uModifier + .5,newV * 2 + vModifier + .5)
                createOctree(depth+1,newX,newY,newZ, u, v)
            end
        else
            love.graphics.setColor(0,0,0,0)
            love.graphics.points(newU * 4 + uModifier + .5, newV * 2 + vModifier + .5)
        end
    end
end