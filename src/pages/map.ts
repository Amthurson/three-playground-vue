/**
 * 世界坐标转屏幕坐标
 * @param Vector3 
 * @param camera 
 * @param x 
 * @param y 
 * @returns {screenX,screenY}
 */
export const mapToScreenPosition = (Vector3,camera,x,y,z) => {
    let world_vector = new Vector3(x,y,z);  
    
    let vector = world_vector.project(camera);
    let halfWidth = window.innerWidth / 2,
        halfHeight = window.innerHeight / 2;  
    
    return {
        x: Math.round(vector.x * halfWidth + halfWidth),
        y: Math.round(-vector.y * halfHeight + halfHeight)  
    }
}