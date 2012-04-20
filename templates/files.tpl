<link class="files" rel="stylesheet" type="text/css" href="{$url_base}/css/files.css" />
{foreach from=$current_user->file_lists item=curr}{if $curr->files|@count gt 0}
<div class="list{if $curr->status eq 'deleted'} dead hidden{/if}">
	<div class="header">
		<div class="button">{if $curr->status eq 'deleted'}unhide{else}hide{/if}</div>
		<div class="name">{$curr->name}</div>
	</div>
	<div class="files"{if $curr->status eq 'deleted'} style="display: none"{/if}>
	{foreach from=$curr->files item=file}
		<div class="file">
			<div class="icon-wrap">
				<a href="{$url_base}/download/{$file->hash}" class="icon"><div class="mime">{if $file->mime}{$file->mime}{else}file{/if}</div></a>
			</div>
			<div class="file-info">
				<div class="row"><span>name</span>{$file->name}</div>
				<div class="row"><span>creator</span>{$file->uploaded_by->name}</div>
				<div class="row"><span>created</span>{$file->uploaded|relative_time}</div>
			</div>
		</div>
	{/foreach}
	</div>
</div>
{/if}{/foreach}
