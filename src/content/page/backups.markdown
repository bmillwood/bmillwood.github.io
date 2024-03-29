---
title: Backups on Linux can be easy!
---
## What I thought it would be like to take backups

I used to believe that doing backups of my data properly would be a slow,
intensive process. Every now and then I'd have to copy all the files on my disk
to another disk. If I didn't want some weird garbled transitional form of my
data, I'd probably have to not do too much else with my laptop while doing the
backup. Maybe I'd have to do it overnight.

I'd need pretty much the full size of my disk in backup space for every copy of
the files I wanted. Given that my files are a mixture of files that change very
infrequently and files that change very frequently, I'd either have to have lots
of redundant copies of some files, or not be able to back up any files very
often. Similarly, I'd either have backups infrequently, so I'd lose a lot of
recent stuff if I needed to restore from them, or I wouldn't have backups going
back very far, so if I wanted to restore something I deleted a while ago, it
would be impossible.

I want to compress my backups so they'll take less space, but compressing the
whole backup as a single archive is a huge headache to access, for example to
restore a single file or check what version I've backed up. Meanwhile,
compressing each file individually means that restoring the backup requires
doing something a bit delicate in replicating a directory hierarchy but with a
decompression command run (only once!) on every file.

## What it's actually like to take backups

I can, at any time, take a full snapshot of the contents of my disk, instantly,
with no interruption to what I'm doing. Snapshots share their identical parts,
so each one takes up a pretty small amount of space, and I can have a lot of
them. The backups are stored compressed, but transparently: I can access any
part of any file as if the snapshot is a normal filesystem. I can transfer these
snapshots onto an external drive by only sending the differences between the
latest snapshots and the ones I've already transferred, so it's relatively quick
and simple to do so.

### How does that work?

The main technologies here are transparent disk compression, and copy-on-write
snapshots.

There's nothing technologically difficult about transparent disk compression,
but when I started looking into this, I didn't realize it was an
easily-accessible, standard feature on many more modern file systems. One of the
lessons to learn here is simply that filesystem technology has moved on since
ext4 was developed.

Copy-on-write snapshots seem significantly more "magic" at first glance, but
they're simpler than they sound. After the snapshot time, whenever any file is
written to, instead of writing to its original location, the filesystem copies
the block that's being written to a new location and makes the change there
instead, and updates the filesystem metadata to say "if you're looking at the
snapshot, look at the old location for this block, whereas if you want the
latest copy, look at this new location". There's some details to figure out in
how you track all the new locations, but that's the core of the idea. You only
copy a filesystem block, not necessarily the whole file, so this doesn't incur
too significant a penalty in write performance, and of course there's a bunch of
caching in the way anyway, so the write performance penalty may not be
noticeable in practice. Again, the lesson is that modern filesystems make some
hard problems easy, if only you know to use the features they offer you.

ZFS and BTRFS (and, I'm sure, others) both support transparent compression and
copy-on-write snapshots. I actually use a combination of both, for reasons I
discuss below.

For what it's worth, I expect that analogues of these features are available on
OS X and Windows. I just don't know about them.

## My process

My laptop automatically takes a snapshot of its disk every time I start it up.

About once a month, I sync all these snapshots to an external disk, which has
every snapshot I've made since 2018.

I also copy (using just plain rsync) the first snapshot of every month to
another external disk that uses zfs instead, and then take a snapshot of that.
So even if btrfs mysteriously chewed up all my data, I still have monthly
snapshots on zfs going back years.

I then delete old snapshots from my laptop disk to free up space (it's smaller
than the external disks).

I won't go into the technical instructions in detail, partly because I don't
remember everything I did. The main purpose of this page is to describe
abstractly what's possible, and how I made the choices I did in setting up the
above process.

## Types of failure

Why have backups? Perhaps the most obvious ways to lose data are:

* The disk storing the data stops working,
* You accidentally tell your computer to destroy it.

While looking for a solution for these, I realized there was another:

* The code for the filesystem you use has a bug, and wipes your disk by accident.

These different failures require somewhat different treatments, but human error
has the potential to be the most destructive, so let's deal with that first.

## Snapshot backups to prevent human error

My main motivation for backups was: suppose I delete a file that turned out to
be important, or edited a config that made something stop working, and I need
the old config back. How can I make all such mistakes reversible?

Snapshotting the whole disk makes sure that I can always go back to a state my
computer was in before. It's a complete state at a single moment in time, so I
don't need to worry about new things mixing with old things in incompatible
ways.

For a lot of mistakes, that's already enough, but I also wanted to protect
against "run this one bad command as root" or "change my disk configuration" or
"change my disk decryption key and forget the new key" and stuff like that.

That's why I send snapshots to an external disk: if the external disk is not
plugged in, and I make a mistake on my laptop, it seems extremely likely that
the external disk still works. If I make a mistake on my laptop *while the
external disk is plugged in*, then yeah, seems possible I could hose both. You
could just be careful while you're doing the sync, but in reality the sync takes
a while and I like to do other things at the same time, so I don't want to be
especially vigilant. This is part of why I have a second backup disk, and I
avoid having both plugged it at once.

Snapshotting does prompt the question of: when do you snapshot, and which
snapshots do you keep? Well, "when" just has to be regularly. Pick whatever
scheduling solution works for you. I take them at startup because it's easy to
arrange. I did for a moment wonder whether taking them at a weird time (e.g.
halfway through boot) could cause problems, but given that I expect my computer
to work even if it has a power failure halfway through the boot process, I
should expect a snapshot taken then to be viable too.

With regards which ones I keep, well, for me for now they're small enough that I
can feasibly keep them all on the external disk at least. Locally I used to do
some thinning-out thing, like all snapshots for a week, and then weekly ones for
a month, and then monthly for some longer time, or something like that. But
because of the way copy-on-write snapshots work, the most "expensive" snapshots
in disk space are always going to be the oldest ones, so I think overthinking
the spacing between is probably not worth it, and nowadays I just keep anything
that's not yet on an external disk (i.e. going no more than a month back).
Nearly all of the time when I've used a snapshot it's been one of the most
recent ones anyway.

## Protecting against filesystem software failure

When I decided to use btrfs to solve the above problem, people warned me "btrfs
is still under active development, a bit on the ambitious side, and has had
stability problems before. It's possible there could be a bug that would mean it
just refused to mount any of your disks one day, and because of all the exotic
things it does to store your data in clever ways, it could be tricky to
recover."

Now, btrfs is more stable than it used to be, but it's hard to predict how bugs
might arise and what their impact could be. Even aside any specific concerns
about btrfs, some shockingly bad software bugs have showed up in pretty basic
functionality of pretty serious software over the last few years, so this does
seem like a real threat.

My approach to this is to just use two filesystems, and hope they don't both
have devastating implementation bugs at the same time, which is why my secondary
backup disk is on zfs. I use plain rsync to copy between them (from a snapshot
on the source, rather than from the live mounted disk, which ensures the zfs
drive has fully consistent snapshots as well). This avoids any tricky special
functionality that might be misimplemented, or misunderstood by me.

I think for people with ordinary data that's an ordinary amount of valuable,
this risk might be too unlikely to bother with. But there are nice things about
having two backup disks anyway, and all it really costs to have them on
different filesystems is (a) my zfs snapshots are less frequent than my btrfs
ones, and (b) taking a zfs snapshot is slower than a btrfs one. These costs
don't feel burdensome for me.

## Protecting against hardware failure

The thing that makes hardware failures comparatively easy to deal with is that
they're generally random and uncorrelated, both with each other and with other
kinds of failure. This means that as long as (a) any single hardware failure
doesn't ruin you, and (b) you can quickly notice and respond to hardware
failures, it's pretty unlikely you'll lose data this way, because you'll be able
to restore redundancy before you're hit by it again.

\(a) is pretty easy to achieve, and in particular my scheme above with the
external disks already achieves it. (b) is a little trickier.

My crude mental model is that disks can fail in two ways: they can just totally
pack it in and die loudly, entirely failing to mount anymore, or they can
quietly flip some bits in a way that makes your data not what you thought it
was.

One of the drawbacks of copy-on-write snapshots in the style we've been
describing is a consequence of one of its strengths: if a file doesn't change
between snapshots, it's only stored once. This is an essential property, without
which there'd be no way we could store a month of snapshots on a disk not much
larger than a single snapshot. But the drawback is that if there was a disk
error that corrupted that file, it's corrupted on every snapshot at once.

Modern filesystems have checksums that can detect this condition, but... you
have to actually look at the checksums. btrfs has `btrfs scrub` for this, but I
don't run it in any systematic way. Probably I should fix that.

### Correlated hardware failures

I said before that hardware failures are uncorrelated, but it's worth mentioning
that there are some easy ways to make this accidentally not true. For example,
if you keep all your backup disks in a pile on your desk and then you pour hot
chocolate on the pile, you have a correlated disk failure. If you keep all the
disks in your house and your house burns down or someone breaks in, you have a
correlated disk failure. In the setup I described, I try to keep the zfs disk in
a drawer in the office at work, and only bring it home when I'm doing the sync.
That level of risk seems acceptable to me.

Using full-disk encryption helps here, because it means that I don't need to
worry too much about keeping the location I store the disk secure.

## Verifying backups

One thing that I don't feel I currently have a good solution for, is confirming
that I could actually restore from my backups if necessary. I only have the one
laptop: I can look at my backups from there, but I'll only need them when I'm
looking at them from somewhere else.

As an example, I got bored of typing the decryption passphrase for my backups so
frequently, so for my convenience I set up a keyfile stored on my laptop (in
addition to the passphrase! I'm not *that* bad). But now I won't immediately
notice if I forget the passphrase, or if it isn't what I thought it was. So I
removed the keyfile, and went back to typing the passphrase every time.

## What am I still not protecting against?

A helpful process to go through is to imagine that you lost all your data, and
ask yourself why it happened. For me I think the leading explanations are:

* I forget the decryption details
* I lose all the disks at once
* The disks fail gradually in a way that I don't notice

The decryption key thing is a tradeoff: the more I protect against forgetting
the key myself, the more options I'm granting to someone who doesn't know it in
the first place. So that tension seems somewhat unavoidable.

The disk loss thing could be mitigated in a variety of ways. Using an internet
backup solution (presumably paid-for) is one, but I don't want to do that,
partly because, again, there are security tradeoffs (or at least, one has to do
work to persuade oneself that a given method is secure).

The gradual disk failure does seem like a place I could make some progress, e.g.
by manually kicking off a btrfs checksum thing when I'm doing the monthly
backup, and figuring out what to do on zfs as well.

This also folds into some more general concern that I have that just checking up
on my laptop's general health is hard, and there are a lot of problems that I
could already have without noticing. I'd be interested what the easy solutions
are there.
