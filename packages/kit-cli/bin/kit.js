#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');

// ─── Import commands ───
const initCmd = require('../commands/init');
const addCmd = require('../commands/add');
const commitCmd = require('../commands/commit');
const logCmd = require('../commands/log');
const statusCmd = require('../commands/status');
const branchCmd = require('../commands/branch');
const checkoutCmd = require('../commands/checkout');
const diffCmd = require('../commands/diff');
const mergeCmd = require('../commands/merge');
const remoteCmd = require('../commands/remote');
const pushCmd = require('../commands/push');
const pullCmd = require('../commands/pull');
const cloneCmd = require('../commands/clone');
const configCmd = require('../commands/config');
const resetCmd = require('../commands/reset');
const tagCmd = require('../commands/tag');
const rmCmd = require('../commands/rm');
const showCmd = require('../commands/show');
const stashCmd = require('../commands/stash');
const revertCmd = require('../commands/revert');

// ─── CLI Setup ───
program
    .name('kit')
    .description(chalk.bold.hex('#8B5CF6')('🧰 Kitwork') + ' — Your own Git')
    .version('1.1.0');

// ─── kit init ───
program
    .command('init')
    .description('Initialize a new Kitwork repository')
    .action(initCmd);

// ─── kit add ───
program
    .command('add')
    .argument('<paths...>', 'Files or directories to stage')
    .description('Stage files for the next commit')
    .action(addCmd);

// ─── kit commit ───
program
    .command('commit')
    .requiredOption('-m, --message <msg>', 'Commit message')
    .option('-a, --author <name>', 'Author name')
    .description('Create a new commit from staged changes')
    .action(commitCmd);

// ─── kit log ───
program
    .command('log')
    .option('-n, --count <n>', 'Number of commits to show', '10')
    .description('Show commit history')
    .action(logCmd);

// ─── kit status ───
program
    .command('status')
    .description('Show the working tree status')
    .action(statusCmd);

// ─── kit branch ───
program
    .command('branch')
    .argument('[name]', 'Branch name to create')
    .description('List or create branches')
    .action(branchCmd);

// ─── kit checkout ───
program
    .command('checkout')
    .argument('<branch>', 'Branch to switch to')
    .description('Switch branches')
    .action(checkoutCmd);

// ─── kit diff ───
program
    .command('diff')
    .description('Show changes in working tree')
    .action(diffCmd);

// ─── kit merge ───
program
    .command('merge')
    .argument('<branch>', 'Branch to merge into current')
    .description('Merge a branch into the current branch')
    .action(mergeCmd);

// ─── kit remote ───
const remoteCommand = program
    .command('remote')
    .description('Manage remote repositories');

remoteCommand
    .command('add')
    .argument('<name>', 'Remote name (e.g. origin)')
    .argument('<url>', 'Remote URL')
    .action(remoteCmd.add);

remoteCommand
    .command('list')
    .action(remoteCmd.list);

// ─── kit push ───
program
    .command('push')
    .argument('<remote>', 'Remote name')
    .argument('<branch>', 'Branch to push')
    .description('Push commits to a remote server')
    .action(pushCmd);

// ─── kit pull ───
program
    .command('pull')
    .argument('<remote>', 'Remote name')
    .argument('<branch>', 'Branch to pull')
    .description('Pull commits from a remote server')
    .action(pullCmd);

// ─── kit clone ───
program
    .command('clone')
    .argument('<url>', 'Repository URL (user/repo or full URL)')
    .argument('[directory]', 'Directory to clone into')
    .description('Clone a remote repository')
    .action(cloneCmd);

// ─── kit config ───
program
    .command('config')
    .argument('[key]', 'Config key (e.g. user.name, user.email)')
    .argument('[value]', 'Value to set')
    .description('Get or set config values')
    .action(configCmd);

// ─── kit reset ───
program
    .command('reset')
    .argument('[target]', 'File to unstage or HEAD~N for soft reset')
    .option('--hard', 'Reset working tree and index to HEAD')
    .option('--soft', 'Move HEAD back (keep changes staged)')
    .description('Unstage files or undo commits')
    .action(resetCmd);

// ─── kit tag ───
const tagCommand = program
    .command('tag')
    .argument('[name]', 'Tag name')
    .argument('[commit]', 'Commit hash to tag (defaults to HEAD)')
    .option('-d, --delete', 'Delete a tag')
    .description('List, create, or delete tags')
    .action((name, commit, opts) => tagCmd.create(name, commit, opts));

// ─── kit rm ───
program
    .command('rm')
    .argument('<files...>', 'Files to remove from tracking')
    .option('--cached', 'Remove from index only, keep file on disk')
    .description('Remove files from tracking')
    .action(rmCmd);

// ─── kit show ───
program
    .command('show')
    .argument('[commit]', 'Commit hash to show (defaults to HEAD)')
    .description('Show commit details')
    .action(showCmd);

// ─── kit stash ───
const stashCommand = program
    .command('stash')
    .description('Save and restore uncommitted changes');

stashCommand
    .command('save')
    .description('Save current changes')
    .action(stashCmd.save);

stashCommand
    .command('pop')
    .description('Restore last stashed changes')
    .action(stashCmd.pop);

stashCommand
    .command('list')
    .description('List all stashes')
    .action(stashCmd.list);

stashCommand
    .command('drop')
    .description('Drop the latest stash')
    .action(stashCmd.drop);

// ─── kit revert ───
program
    .command('revert')
    .argument('<commit>', 'Commit hash to revert')
    .description('Create a new commit that undoes a previous commit')
    .action(revertCmd);

program.parse();
