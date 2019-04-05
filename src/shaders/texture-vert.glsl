#version 300 es
precision highp float;

// The vertex shader used to render the background of the scene

in vec4 vs_Pos;
uniform mat4 u_ViewProj;
uniform mat4 u_Model;
out vec2 fs_Pos;
uniform sampler2D u_RenderedTexture;


void main() {
    fs_Pos = vs_Pos.xz;
    vec2 xy = vec2(0.5 * (fs_Pos.x + 1.0), 0.5 * (fs_Pos.y + 1.0));

    vec4 textureColor = texture(u_RenderedTexture, xy);
    vec4 pos = vs_Pos;

    float height = textureColor.r;
    pos.y += height;

    gl_Position = u_ViewProj * vec4(pos.xyz, 1.0);
}
