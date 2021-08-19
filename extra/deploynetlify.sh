#!/bin/bash 

project_name='CryptoGost'
build_path='/home/alr/temp/'
tr_path=$build_path'tr/'
md_files_path='/home/alr/temp/'$project_name'/content/'


# remove all from tempdir
sudo rm -rf $build_path* || true
sudo find  $build_path -type f -name '.*' -delete

# make temp dir to md-files
sudo mkdir -p $tr_path
sudo cp -rT docs $tr_path

# pull github repo and remove md-files 
cd $build_path
sudo git clone https://$GITHUB_LOGIN:$GITHUB_PASSWORD@github.com/DigtLab-QA/$project_name
cd $project_name
sudo git checkout master
cd content
sudo find $md_files_path  -type d -name 'v2*' -exec rm -rf {} \;
sudo find $md_files_path  -type f -name 'v2*' -exec rm -f {} \;
sudo find $md_files_path  -type d -name 'faq' -exec rm -rf {} \;
sudo find $md_files_path  -type f -name 'faq' -exec rm -f {} \;

# copy files from gitlab repo
current_path=$(pwd)
sudo cp -rT $tr_path $current_path
cd ..

# commit and push to github repo
sudo git config user.email 'you@example.com' && \
sudo git config user.name 'Your Name' && \
sudo git add * && \
sudo git commit -a -m 'desc' && \
sudo git push origin HEAD:master

# remove all from tempdir
sudo rm -rf $build_path* || true
sudo find  $build_path -type f -name '.*' -delete
