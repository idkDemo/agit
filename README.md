# acv-git

ACV Git 

## How it works: 
- It is a super-set of git: it means that you can use all the git commands like you would do with the git cli
- Start with the init command. It will add all the necessary files like .git, .gitconfig .gitattributes .gitignore.... 
- Not that ACV use a custom hand-made merge drivers and diff tool. These are customable if needed in the .gitconfig of each project ! 
- add your lfs
- Use it like any git repository ! This means that branching, merging ect... workds as well ! 


Under the hood ACV split your .als into small JSONs files written in .working. All files in .working is staged in git. 
Whenever you commmit .als files will be split and add to the stage. 
When you pull changes a script is call and all .json files is collected and reassemble in a beautiful .als file ! 

Note that not every part of a .als file is shared only the data that really matter in order to limit bugs and stuff. If something is not stagged and should do feel free to open an Issue ! 

ACV uses JSON-MERGER for merging different version of tracks. Not that when a conflict occur you could ether choose to overwrite the conflict, or create a track bellow the current one to resolve the conflict by hand and the third options is to use a custom relsoving tool that lets you choose what part of each version you would use. 
