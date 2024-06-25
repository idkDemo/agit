export default {
    "pre-commithooks/pre-commit.sh": "echo agit split",
    ".gitignore": "Backup/*\r\n.als",
    ".gitconfig": "[diff \"zcat\"]\r\n\ttextconv = zcat\r\n[merge 'agit']\r\n    name=agit\r\n    driver=agit merge %O %A %B %L %P\r\n    recursive=binary\r\n\r\n[lfs]\r\n\trepositoryformatversion = 0\r\n\tstandalonetransferagent = lfs-folder\r\n[lfs \"customtransfer.lfs-folder\"]\r\n\tpath = agit lfs-folder-agent\r\n\targs = \"PUT YOUR PATH HERE\"",
    ".gitattributes": "Samples/** filter=lfs diff=lfs merge=lfs -text\r\n\r\n./working/track/*.xml diff=binary merge=agit\r\n./working/* diff=text"
};