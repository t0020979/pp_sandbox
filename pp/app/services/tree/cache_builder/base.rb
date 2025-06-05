# frozen_string_literal: true

class Tree::CacheBuilder::Base < ::Nsud::Essentials::ApplicationService
  def initialize(cacheable_id, query_params = {})
    @cacheable_id = cacheable_id
    @query_params = query_params.merge(context_params).deep_symbolize_keys
  end

  def call
    ActiveRecord::Base.transaction do
      mark_previous_as_deleted
      create_new_version(data: build_data, meta: build_meta)
    end
  end

  private

  def context_params
    @context_params ||= {}
  end

  def context_key
    self.class.name.demodulize.underscore
  end

  def cacheable_type
    raise NotImplementedError
  end

  def mark_previous_as_deleted
    CachedTree.for_cache(context_key, cacheable_type, cacheable_id)
              .update_all(deleted_at: Time.now)
  end

  def create_new_version(data:, meta:)
    CachedTree.create!(
      cacheable_type: cacheable_type,
      cacheable_id: cacheable_id,
      context_key: context_key,
      query_params: query_params,
      data: data,
      meta: meta
    )
  end

  attr_reader :cacheable_id, :query_params, :context_params
end