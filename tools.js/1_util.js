module.exports = {
  //export const fromCharCode = (c: number): string => String.fromCharCode(c);
  //export const upper = (c: number): string => fromCharCode(c).toUpperCase();
  //export const lower = (c: number): string => fromCharCode(c).toLowerCase();
  hex : function(n/*: number*/)/*: string => */{ return `0x${n.toString(16).toUpperCase()}` }
};
